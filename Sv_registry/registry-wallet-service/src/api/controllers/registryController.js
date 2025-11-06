const { Credit, Wallet, Ledger, sequelize } = require('../../db/models');
const { publishEvent } = require('../../event/producer');

/**
 * POST /registry/mintInternal
 * Body: { serial, ownerId (userId), quantity, sourceTripId?, mintedAt?, metadata?, jsonPath? }
 * This endpoint must be called internally (protected) after verification.
 */
module.exports = {
  async mintInternal(req, res) {
    const { serial, ownerId, quantity, sourceTripId = null, mintedAt = null, metadata = {}, jsonPath } = req.body;
    if (!serial || !ownerId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'serial, ownerId and positive quantity are required' });
    }

    const t = await sequelize.transaction();
    try {
      // ensure unique serial
      const existing = await Credit.findOne({ where: { serial }, transaction: t, lock: t.LOCK.UPDATE });
      if (existing) {
        await t.rollback();
        return res.status(409).json({ error: 'Credit serial already exists' });
      }

      // create credit record
      const credit = await Credit.create({ serial, ownerId, quantity, sourceTripId, mintedAt }, { transaction: t });

      // create ledger entry
      const ledger = await Ledger.create({ creditSerial: serial, type: 'MINT', toUserId: ownerId, txRef: metadata.txRef || null }, { transaction: t });

      // update wallet totalBalance atomically
      await Wallet.update(
        { totalBalance: sequelize.literal(`(COALESCE("totalBalance",0) + ${Number(quantity)})`) },
        { where: { userId: ownerId }, transaction: t }
      );

      // optionally update nested JSONB path where needed
      if (jsonPath) {
        const pathArray = jsonPath.split('.').map(p => p.replace(/"/g, ''));
        const pgPath = '{' + pathArray.join(',') + '}';
        const expr = `jsonb_set(coalesce("balanceJson", '{}'::jsonb), '${pgPath}', to_jsonb((COALESCE(("balanceJson"#>>'${pgPath}'), '0')::numeric + ${Number(quantity)})))`;
        await Wallet.update(
          { balanceJson: sequelize.literal(expr) },
          { where: { userId: ownerId }, transaction: t }
        );
      }

      await t.commit();

      // publish event after commit
      publishEvent('credits.minted', { serial, ownerId, quantity, creditId: credit.id, metadata });

      return res.status(201).json({ credit, ledger });
    } catch (err) {
      await t.rollback();
      console.error('mintInternal failed', err);
      return res.status(500).json({ error: 'Failed to mint credit' });
    }
  }
};
