// Handlers registry for events. Export functions keyed by topic/routingKey.
// Add handlers here and import in your app when starting the consumer.

module.exports = {
  // wildcard handler
  '*': async ({ topic, routingKey, content, raw }) => {
    console.log('Default handler received event', topic || routingKey, content);
  },

  // example specific handlers:
  'credits.minted': async ({ topic, content }) => {
    console.log('Handle credits.minted', content);
    // e.g. update DB, notify wallets, etc.
  },

  'payments.escrow.updated': async ({ topic, content }) => {
    console.log('Handle payments.escrow.updated', content);
    // implement escrow handling logic here
  }
};
