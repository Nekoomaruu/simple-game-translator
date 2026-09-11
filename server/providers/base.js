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

  // Opsional: provider yang punya endpoint kuota resmi (mis. DeepL) meng-override
  // ini dan mengembalikan { kind: 'characters' | 'tokens', used, limit }.
  // Provider tanpa konsep kuota (mis. Google Translate publik) membiarkan ini
  // melempar, dan pemanggil menganggap usage tidak tersedia.
  async checkUsage() {
    throw new Error(`checkUsage() not supported for provider ${this.constructor.name}`);
  }
}

module.exports = { TranslationProvider };
