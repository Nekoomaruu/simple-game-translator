const { TranslationProvider } = require('./base');

const FREE_API_HOST = 'https://api-free.deepl.com';
const PRO_API_HOST = 'https://api.deepl.com';

function hostForKey(apiKey) {
  return apiKey.endsWith(':fx') ? FREE_API_HOST : PRO_API_HOST;
}

class DeepLProvider extends TranslationProvider {
  async translate(text, sourceLang, targetLang) {
    const host = hostForKey(this.config.apiKey);
    const response = await fetch(`${host}/v2/translate`, {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: [text],
        source_lang: sourceLang,
        target_lang: targetLang
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`DeepL request failed (${response.status}): ${body}`);
    }

    const payload = await response.json();
    return payload.translations[0].text;
  }

  async verify() {
    await this.translate('test', 'EN', 'ID');
    return true;
  }
}

module.exports = { DeepLProvider };
