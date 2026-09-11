const fs = require('fs');
const path = require('path');

class TranslationCache {
  constructor(cacheFilePath) {
    this.cacheFilePath = cacheFilePath;
    this.entries = this._load();
  }

  _load() {
    if (!fs.existsSync(this.cacheFilePath)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.cacheFilePath, 'utf8'));
    } catch {
      return {};
    }
  }

  get(sourceText) {
    return this.entries[sourceText];
  }

  set(sourceText, translatedText) {
    this.entries[sourceText] = translatedText;
  }

  get size() {
    return Object.keys(this.entries).length;
  }

  save() {
    fs.mkdirSync(path.dirname(this.cacheFilePath), { recursive: true });
    fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.entries, null, 2), 'utf8');
  }
}

module.exports = { TranslationCache };
