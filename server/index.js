const express = require('express');
const path = require('path');
const { registerRoutes } = require('./routes');

const app = express();
const PORT = process.env.PORT || 4173;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

registerRoutes(app);

app.listen(PORT, () => {
  console.log(`Simple Game Translator berjalan di http://localhost:${PORT}`);
});
