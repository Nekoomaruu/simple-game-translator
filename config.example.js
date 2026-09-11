module.exports = {
  // biarin aja jangan diubah
  port: 4173,

  // Provider default yang otomatis terpilih saat aplikasi dibuka.
  // Pilihan: "deepl", "google", "openai-compatible.
  defaultProvider: 'google',

  providers: {
    deepl: {
      apiKey: ''
    },
    'openai-compatible': {
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini'
    }
  },

  translation: {
    // Bahasa sumber default: "EN" atau "JA"
    sourceLang: 'EN',
    targetLang: 'ID',
    maxCharsPerLine: 74
  }
};
