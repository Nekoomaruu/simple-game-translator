const express = require('express');
const path = require('path');
const { registerRoutes } = require('./routes');
const { loadConfig, CONFIG_PATH } = require('./core/config');

const app = express();
const config = loadConfig();
const PORT = process.env.PORT || config.port;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

registerRoutes(app);

app.listen(PORT, () => {
  console.log(`Simple Game Translator berjalan di http://localhost:${PORT}`);
  if (config.usingExampleConfig) {
    console.log(`Belum ada config.js — salin config.example.js jadi config.js untuk mengisi API key default.`);
  }
});
