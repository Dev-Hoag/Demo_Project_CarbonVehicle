const { Wallet, Ledger, Credit, sequelize } = require('../../db/models');
const { Op, Sequelize } = require('sequelize');
const { publishEvent } = require('../../event/producer');

module.exports = {
  async createWallet(req, res) {
    // create wallet with userId as primary key
    const { userId, initialBalance = 0, balanceJson = {} } = req.body;
    try {
      const wallet = await Wallet.create({ userId, totalBalance: initialBalance, balanceJson });
      res.status(201).json(wallet);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to create wallet' });
    }
  },

  async getWallet(req, res) {
    try {
      const userId = req.params.id;
      const wallet = await Wallet.findByPk(userId);
      if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
      res.json(wallet);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch wallet' });
    }
  },

  async getBalance(req, res) {
    try {
      const userId = req.params.userId;
      // explicit query by userId
      const wallet = await Wallet.findOne({ where: { userId }, attributes: ['userId', 'totalBalance', 'balanceJson'] });
      if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

      // totalBalance is DECIMAL in DB; return as string to preserve precision
      res.json({ userId: wallet.userId, totalBalance: wallet.totalBalance, balanceJson: wallet.balanceJson });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch wallet balance' });
    }
  },

  async creditWallet(req, res) {
    // credit by userId (path param)
    const userId = req.params.id;
    const { amount, metadata = {}, jsonPath } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const t = await sequelize.transaction();
    try {
      // lock the wallet row to ensure atomic update
      const wallet = await Wallet.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!wallet) {
        await t.rollback();
        return res.status(404).json({ error: 'Wallet not found' });
      }

      // create ledger entry
      const ledger = await Ledger.create({ creditSerial: metadata.creditSerial || null, type: 'MINT', toUserId: userId, txRef: metadata.txRef || null }, { transaction: t });

      // update totalBalance atomically using SQL expression
      await Wallet.update(
        { totalBalance: sequelize.literal(`(COALESCE("totalBalance",0) + ${Number(amount)})`) },
        { where: { userId }, transaction: t }
      );

      // optionally update a nested JSONB path (jsonPath should be dot-separated, e.g. 'projects.projectA')
      if (jsonPath) {
        const pathArray = jsonPath.split('.').map(p => p.replace(/"/g, ''));
        const pgPath = '{' + pathArray.join(',') + '}';
        // increment the numeric value at that JSON path (or set to amount if absent)
        const expr = `jsonb_set(coalesce("balanceJson", '{}'::jsonb), '${pgPath}', to_jsonb((COALESCE(("balanceJson"#>>'${pgPath}'), '0')::numeric + ${Number(amount)})))`;
        await Wallet.update(
          { balanceJson: sequelize.literal(expr) },
          { where: { userId }, transaction: t }
        );
      }

      await t.commit();

      publishEvent('credits.minted', { userId, amount, ledgerId: ledger.id });

      // fetch updated wallet to return
      const updated = await Wallet.findByPk(userId);
      res.json({ wallet: updated, ledger });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: 'Failed to credit wallet' });
    }
  },

  async debitWallet(req, res) {
    const userId = req.params.id;
    const { amount, metadata = {}, jsonPath } = req.body;
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const t = await sequelize.transaction();
    try {
      const wallet = await Wallet.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!wallet) {
        await t.rollback();
        return res.status(404).json({ error: 'Wallet not found' });
      }

      if ((Number(wallet.totalBalance) || 0) < Number(amount)) {
        await t.rollback();
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const ledger = await Ledger.create({ creditSerial: metadata.creditSerial || null, type: 'TRANSFER', fromUserId: userId, txRef: metadata.txRef || null }, { transaction: t });

      // decrement totalBalance atomically
      await Wallet.update(
        { totalBalance: sequelize.literal(`(COALESCE("totalBalance",0) - ${Number(amount)})`) },
        { where: { userId }, transaction: t }
      );

      // optionally decrement nested JSONB path
      if (jsonPath) {
        const pathArray = jsonPath.split('.').map(p => p.replace(/"/g, ''));
        const pgPath = '{' + pathArray.join(',') + '}';
        const expr = `jsonb_set(coalesce("balanceJson", '{}'::jsonb), '${pgPath}', to_jsonb((COALESCE(("balanceJson"#>>'${pgPath}'), '0')::numeric - ${Number(amount)})))`;
        await Wallet.update(
          { balanceJson: sequelize.literal(expr) },
          { where: { userId }, transaction: t }
        );
      }

      await t.commit();

      publishEvent('credits.transferred', { userId, amount, ledgerId: ledger.id });

      const updated = await Wallet.findByPk(userId);
      res.json({ wallet: updated, ledger });
    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: 'Failed to debit wallet' });
    }
  },

  // Transfer endpoint used for both LOCK (escrow) and TRANSFER
  // Payload example for LOCK:
  // { type: 'LOCK', fromUserId: 'seller', amount: 10, orderId: 'order-123', metadata: { txRef } }
  // Payload example for TRANSFER:
  // { type: 'TRANSFER', fromUserId: 'alice', toUserId: 'bob', amount: 5, metadata: { txRef } }
  async transfer(req, res) {
    const { type, fromUserId, toUserId, amount, orderId, metadata = {}, jsonPath } = req.body;

    if (!type || !['LOCK', 'TRANSFER', 'UNLOCK'].includes(type)) return res.status(400).json({ error: 'Invalid type; must be LOCK, TRANSFER, or UNLOCK' });
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const t = await sequelize.transaction();
    try {
      if (type === 'LOCK') {
        const { creditSerials = [] } = metadata;
        if (!fromUserId) { await t.rollback(); return res.status(400).json({ error: 'fromUserId required for LOCK' }); }
        if (!orderId) { await t.rollback(); return res.status(400).json({ error: 'orderId required for LOCK' }); }
        if (!creditSerials.length) { await t.rollback(); return res.status(400).json({ error: 'creditSerials required in metadata for LOCK' }); }

        // lock seller wallet and fetch credits atomically
        const [wallet, credits] = await Promise.all([
          Wallet.findByPk(fromUserId, { transaction: t, lock: t.LOCK.UPDATE }),
          Credit.findAll({ 
            where: { 
              serial: creditSerials,
              ownerId: fromUserId,
              status: 'MINTED' 
            },
            transaction: t,
            lock: t.LOCK.UPDATE
          })
        ]);

        if (!wallet) { await t.rollback(); return res.status(404).json({ error: 'Wallet not found' }); }
        if (credits.length !== creditSerials.length) {
          await t.rollback();
          return res.status(400).json({ error: 'One or more credits not found or already locked' });
        }

        // sum credit quantities to verify amount
        const totalCreditAmount = credits.reduce((sum, c) => sum + Number(c.quantity), 0);
        if (totalCreditAmount !== Number(amount)) {
          await t.rollback();
          return res.status(400).json({ error: 'Credit amounts do not match lock amount' });
        }

        if ((Number(wallet.totalBalance) || 0) < Number(amount)) {
          await t.rollback();
          return res.status(400).json({ error: 'Insufficient balance to lock' });
        }

        // decrement available balance
        await Wallet.update(
          { totalBalance: sequelize.literal(`(COALESCE("totalBalance",0) - ${Number(amount)})`) },
          { where: { userId: fromUserId }, transaction: t }
        );

        // increment escrow entry under balanceJson.escrow.<orderId>
        const safeOrderId = String(orderId).replace(/"/g, '').replace(/'/g, "''");
        const pgPath = '{escrow,' + safeOrderId + '}';
        const expr = `jsonb_set(coalesce("balanceJson", '{}'::jsonb), '${pgPath}', to_jsonb((COALESCE(("balanceJson"#>>'${pgPath}'), '0')::numeric + ${Number(amount)})))`;
        await Wallet.update(
          { balanceJson: sequelize.literal(expr) },
          { where: { userId: fromUserId }, transaction: t }
        );

        // update credit statuses to LOCKED
        await Credit.update(
          { status: 'LOCKED' },
          { where: { serial: creditSerials }, transaction: t }
        );

        const ledger = await Ledger.create({ 
          creditSerial: creditSerials.join(','), 
          type: 'LOCK', 
          fromUserId, 
          toUserId: toUserId || null, 
          txRef: metadata.txRef || orderId 
        }, { transaction: t });

        await t.commit();

        publishEvent('credits.locked', { 
          fromUserId, 
          toUserId, 
          amount, 
          orderId, 
          creditSerials,
          ledgerId: ledger.id 
        });

        const [updated, lockedCredits] = await Promise.all([
          Wallet.findByPk(fromUserId),
          Credit.findAll({ where: { serial: creditSerials }})
        ]);
        
        return res.json({ 
          wallet: updated, 
          ledger,
          credits: lockedCredits
        });
      }

      if (type === 'UNLOCK') {
        const { creditSerials = [] } = metadata;
        if (!fromUserId) { await t.rollback(); return res.status(400).json({ error: 'fromUserId required for UNLOCK' }); }
        if (!orderId) { await t.rollback(); return res.status(400).json({ error: 'orderId required for UNLOCK' }); }
        if (!creditSerials.length) { await t.rollback(); return res.status(400).json({ error: 'creditSerials required in metadata for UNLOCK' }); }

        // lock wallet and fetch credits atomically
        const [wallet, credits] = await Promise.all([
          Wallet.findByPk(fromUserId, { transaction: t, lock: t.LOCK.UPDATE }),
          Credit.findAll({
            where: {
              serial: creditSerials,
              ownerId: fromUserId,
              status: 'LOCKED'
            },
            transaction: t,
            lock: t.LOCK.UPDATE
          })
        ]);

        if (!wallet) { await t.rollback(); return res.status(404).json({ error: 'Wallet not found' }); }
        if (credits.length !== creditSerials.length) {
          await t.rollback();
          return res.status(400).json({ error: 'One or more credits not found or not in LOCKED state' });
        }

        // verify credits amount matches escrow
        const escrowAmount = wallet.balanceJson?.escrow?.[orderId] || 0;
        const totalCreditAmount = credits.reduce((sum, c) => sum + Number(c.quantity), 0);

        if (Number(escrowAmount) !== Number(amount) || Number(totalCreditAmount) !== Number(amount)) {
          await t.rollback();
          return res.status(400).json({ error: 'Credit amounts do not match escrow amount or unlock amount' });
        }

        // clear escrow entry
        const safeOrderId = String(orderId).replace(/"/g, '').replace(/'/g, "''");
        const escrowPath = '{escrow,' + safeOrderId + '}';

        // remove from escrow and restore to available balance
        await Wallet.update(
          {
            balanceJson: sequelize.literal(`jsonb_set(coalesce("balanceJson", '{}'::jsonb), '${escrowPath}', '0')`),
            totalBalance: sequelize.literal(`(COALESCE("totalBalance",0) + ${Number(amount)})`)
          },
          { where: { userId: fromUserId }, transaction: t }
        );

        // update credit status back to MINTED
        await Credit.update(
          { status: 'MINTED' },
          { where: { serial: creditSerials }, transaction: t }
        );

        const ledger = await Ledger.create({
          creditSerial: creditSerials.join(','),
          type: 'UNLOCK',
          fromUserId,
          txRef: metadata.txRef || orderId
        }, { transaction: t });

        await t.commit();

        publishEvent('credits.unlocked', {
          fromUserId,
          amount,
          orderId,
          creditSerials,
          ledgerId: ledger.id
        });

        const [updated, unlockedCredits] = await Promise.all([
          Wallet.findByPk(fromUserId),
          Credit.findAll({ where: { serial: creditSerials }})
        ]);

        return res.json({
          wallet: updated,
          ledger,
          credits: unlockedCredits
        });
      }

      if (type === 'TRANSFER') {
        const { creditSerials = [], orderId } = metadata;
        if (!fromUserId || !toUserId) { await t.rollback(); return res.status(400).json({ error: 'fromUserId and toUserId required for TRANSFER' }); }
        if (!creditSerials.length) { await t.rollback(); return res.status(400).json({ error: 'creditSerials required in metadata for TRANSFER' }); }
        if (!orderId) { await t.rollback(); return res.status(400).json({ error: 'orderId required in metadata for TRANSFER' }); }

        // lock both wallets and fetch credits atomically
        const ids = [fromUserId, toUserId].sort();
        const [[fromWallet, toWallet], credits] = await Promise.all([
          Wallet.findAll({ where: { userId: ids }, transaction: t, lock: t.LOCK.UPDATE })
            .then(wallets => [
              wallets.find(w => w.userId === fromUserId),
              wallets.find(w => w.userId === toUserId)
            ]),
          Credit.findAll({ 
            where: { 
              serial: creditSerials,
              ownerId: fromUserId,
              status: 'LOCKED'  // Must be previously locked
            },
            transaction: t,
            lock: t.LOCK.UPDATE
          })
        ]);

        if (!fromWallet || !toWallet) { 
          await t.rollback(); 
          return res.status(404).json({ error: 'One or both wallets not found' }); 
        }

        if (credits.length !== creditSerials.length) {
          await t.rollback();
          return res.status(400).json({ error: 'One or more credits not found or not in LOCKED state' });
        }

        // verify credits are locked in escrow for this order
        const escrowAmount = fromWallet.balanceJson?.escrow?.[orderId] || 0;
        const totalCreditAmount = credits.reduce((sum, c) => sum + Number(c.quantity), 0);
        
        if (Number(escrowAmount) !== Number(amount) || Number(totalCreditAmount) !== Number(amount)) {
          await t.rollback();
          return res.status(400).json({ error: 'Credit amounts do not match escrow amount or transfer amount' });
        }

        // clear escrow entry and adjust total balances
        const safeOrderId = String(orderId).replace(/"/g, '').replace(/'/g, "''");
        const escrowPath = '{escrow,' + safeOrderId + '}';
        
        // remove from escrow by setting to 0
        await Wallet.update(
          { 
            balanceJson: sequelize.literal(`jsonb_set(coalesce("balanceJson", '{}'::jsonb), '${escrowPath}', '0')`),
            totalBalance: sequelize.literal(`(COALESCE("totalBalance",0) - ${Number(amount)})`)
          },
          { where: { userId: fromUserId }, transaction: t }
        );

        // increment buyer's balance
        await Wallet.update(
          { totalBalance: sequelize.literal(`(COALESCE("totalBalance",0) + ${Number(amount)})`) },
          { where: { userId: toUserId }, transaction: t }
        );

        // optional jsonPath adjustments for categories/vintage/etc
        if (jsonPath) {
          const pathArray = jsonPath.split('.').map(p => p.replace(/"/g, ''));
          const pgPath = '{' + pathArray.join(',') + '}';
          const exprTo = `jsonb_set(coalesce("balanceJson", '{}'::jsonb), '${pgPath}', to_jsonb((COALESCE(("balanceJson"#>>'${pgPath}'), '0')::numeric + ${Number(amount)})))`;
          await Wallet.update(
            { balanceJson: sequelize.literal(exprTo) }, 
            { where: { userId: toUserId }, transaction: t }
          );
        }

        // transfer credit ownership and update status
        await Credit.update(
          { 
            ownerId: toUserId,
            status: 'MINTED'  // Reset to MINTED for new owner
          },
          { where: { serial: creditSerials }, transaction: t }
        );

        const ledger = await Ledger.create({ 
          creditSerial: creditSerials.join(','),
          type: 'TRANSFER',
          fromUserId,
          toUserId,
          txRef: metadata.txRef || orderId
        }, { transaction: t });

        await t.commit();

        publishEvent('credits.transferred', { 
          fromUserId,
          toUserId,
          amount,
          orderId,
          creditSerials,
          ledgerId: ledger.id
        });

        const [updatedFrom, updatedTo, transferredCredits] = await Promise.all([
          Wallet.findByPk(fromUserId),
          Wallet.findByPk(toUserId),
          Credit.findAll({ where: { serial: creditSerials }})
        ]);
        
        return res.json({ 
          from: updatedFrom,
          to: updatedTo,
          ledger,
          credits: transferredCredits
        });
      }

    } catch (err) {
      await t.rollback();
      console.error(err);
      res.status(500).json({ error: 'Failed to process transfer' });
    }
  }
};
