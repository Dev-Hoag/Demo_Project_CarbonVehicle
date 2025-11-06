require('dotenv').config();
const express = require('express');
const bodyParser = require('express').json;
const { sequelize } = require('./db/models');
const apiRouter = require('./api');

const app = express();
app.use(bodyParser());

app.use('/api', apiRouter);

app.get('/', (req, res) => res.json({ status: 'ok', service: 'registry-wallet-service' }));

const port = process.env.PORT || 3000;

async function start() {
  try {
    if (process.env.NODE_ENV === 'development') {
      // For dev convenience, ensure DB is connected
      await sequelize.authenticate();
      console.log('DB connected');
    }

    app.listen(port, () => console.log(`Server listening on port ${port}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
