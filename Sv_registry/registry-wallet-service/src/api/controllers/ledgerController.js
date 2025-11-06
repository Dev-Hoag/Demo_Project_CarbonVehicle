const { Ledger } = require('../../db/models');

module.exports = {
  async getLedgerForWallet(req, res) {
    const walletId = req.params.id;
    const { limit = 50, offset = 0 } = req.query;
    try {
      const rows = await Ledger.findAll({ where: { walletId }, order: [['createdAt', 'DESC']], limit: Number(limit), offset: Number(offset) });
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch ledger' });
    }
  }
};
