const { TranslationProvider } = require('./base');

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

class GoogleTranslateProvider extends TranslationProvider {
  async translate(text, sourceLang, targetLang) {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLang.toLowerCase(),
      tl: targetLang.toLowerCase(),
      dt: 't',
      q: text
    });

    const response = await fetch(`${ENDPOINT}?${params}`);
    if (!response.ok) {
      throw new Error(`Google Translate request failed (${response.status})`);
    }

    const payload = await response.json();
    return payload[0].map((segment) => segment[0]).join('');
  }

  async verify() {
    await this.translate('test', 'en', 'id');
    return true;
  }
}

module.exports = { GoogleTranslateProvider };
