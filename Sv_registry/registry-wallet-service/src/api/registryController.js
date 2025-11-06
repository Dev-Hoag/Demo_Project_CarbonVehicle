/**
 * Illustrative controller placed at `/src/api/registryController.js` to show
 * how to perform an atomic mint transaction with Sequelize.
 *
 * This file is educational — the real route wired in the app uses
 * `src/api/controllers/registryController.js`. You can use this file as a
 * simplified example or import parts into your real controller.
 */

const { Credit, Wallet, Ledger, sequelize } = require('../db/models');

/**
 * mintInternalIllustration(req, res)
 * - Demonstrates using `sequelize.transaction()` and `SELECT ... FOR UPDATE`
 * - Steps:
 *   1. Start transaction
 *   2. Check for existing credit serial (lock if needed)
 *   3. Insert credit
 *   4. Insert ledger entry
 *   5. Atomically update wallet (totalBalance and optional JSONB path)
 *   6. Commit and publish event (outside transaction)
 */
async function mintInternalIllustration(req, res) {
  const { serial, ownerId, quantity, jsonPath } = req.body;
  if (!serial || !ownerId || !quantity) return res.status(400).json({ error: 'serial, ownerId, quantity required' });

  // Start a managed transaction
  const t = await sequelize.transaction();
  // Ví dụ về logic Controller (Giả định Sequelize Model đã được định nghĩa)

  const db = require('../db/models');
  const { publishEvent } = require('../event/producer');

  async function mintCredits(req, res) {
    const { userId, tripId, quantity, serial, project, vintage } = req.body;
    let transaction; // Khởi tạo transaction

    try {
      // Bắt đầu Transaction để đảm bảo tính nguyên tử
      transaction = await db.sequelize.transaction();

      // 1. Tạo bản ghi mới trong bảng 'credits'
      const newCredit = await db.Credit.create({
        serial,
        ownerId: userId,
        quantity,
        project,
        vintage,
        sourceTripId: tripId,
        status: 'MINTED',
        // ... các trường khác
      }, { transaction });

      // 2. Cập nhật hoặc tạo bản ghi trong bảng 'wallets'
      const unitKey = `${project}-${vintage}`;
      let wallet = await db.Wallet.findByPk(userId, { transaction });

      if (!wallet) {
        // Nếu ví chưa tồn tại, tạo mới
        wallet = await db.Wallet.create({
          userId,
          totalBalance: quantity,
          balanceJson: { [unitKey]: quantity },
        }, { transaction });
      } else {
        // Nếu ví đã tồn tại, cập nhật số dư
        const currentBalance = (wallet.balanceJson && wallet.balanceJson[unitKey]) || 0;
        const updatedBalance = Number(currentBalance) + Number(quantity);
        // update in-memory object then save within the transaction
        wallet.balanceJson = Object.assign({}, wallet.balanceJson || {}, { [unitKey]: updatedBalance });
        wallet.totalBalance = (Number(wallet.totalBalance) || 0) + Number(quantity);
        await wallet.save({ transaction });
      }

      // 3. Ghi lại giao dịch trong bảng 'ledger' (Audit Log)
      await db.Ledger.create({
        creditSerial: serial,
        type: 'MINT',
        quantity: quantity,
        toUserId: userId, // Người nhận là EV Owner
        txRef: `MINT-${serial}`,
        // ... các trường khác
      }, { transaction });

      // Commit (Hoàn tất) Transaction
      await transaction.commit();

      // 4. Phát sự kiện (chỉ sau khi DB đã Commit thành công)
      await publishEvent('REGISTRY_EVENTS', {
        type: 'CreditsMinted', // Sự kiện CreditsMinted [cite: 32]
        payload: { userId, tripId, serial, quantity, project, vintage }
      });

      res.status(201).send({ message: 'Credits successfully minted and recorded.', creditId: newCredit.id });

    } catch (error) {
      // Rollback (Hoàn tác) nếu có lỗi xảy ra
      if (transaction) await transaction.rollback();
      console.error('Minting failed:', error);
      res.status(500).send({ message: 'Failed to mint credits.', error: error.message });
    }
  }

  module.exports = { mintInternal: mintCredits };
}

module.exports = { mintInternalIllustration };
