const { TranslationProvider } = require('./base');

function buildPrompt(text, sourceLang, targetLang) {
  return [
    `Translate the following game text from ${sourceLang} to ${targetLang}.`,
    'Keep placeholder tokens like ZXZXABC or ZXZXNL exactly as they are, unchanged and in the same relative position.',
    'Reply with only the translated text, no explanation, no quotes.',
    '',
    text
  ].join('\n');
}

class OpenAICompatibleProvider extends TranslationProvider {
  constructor(config) {
    super(config);
    this.lastUsage = null;
  }

  async translate(text, sourceLang, targetLang) {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.2,
        messages: [
          { role: 'user', content: buildPrompt(text, sourceLang, targetLang) }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Chat completion request failed (${response.status}): ${body}`);
    }

    const payload = await response.json();
    if (payload.usage) this.lastUsage = payload.usage;
    return payload.choices[0].message.content.trim();
  }

  async verify() {
    await this.translate('test', 'EN', 'ID');
    return true;
  }
}

module.exports = { OpenAICompatibleProvider };
