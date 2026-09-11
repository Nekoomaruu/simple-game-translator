const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.js');
const EXAMPLE_PATH = path.join(__dirname, '..', '..', 'config.example.js');

function loadConfig() {
  const source = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_PATH;
  delete require.cache[require.resolve(source)];
  const userConfig = require(source);

  return {
    port: userConfig.port || 4173,
    defaultProvider: userConfig.defaultProvider || 'google',
    providers: userConfig.providers || {},
    translation: {
      sourceLang: 'EN',
      targetLang: 'ID',
      maxCharsPerLine: 74,
      ...(userConfig.translation || {})
    },
    usingExampleConfig: source === EXAMPLE_PATH
  };
}

module.exports = { loadConfig, CONFIG_PATH };
