class TranslationProvider {
  constructor(config) {
    this.config = config;
  }

  async translate(text, sourceLang, targetLang) {
    throw new Error(`translate() not implemented for provider ${this.constructor.name}`);
  }

  async verify() {
    throw new Error(`verify() not implemented for provider ${this.constructor.name}`);
  }
}

module.exports = { TranslationProvider };
