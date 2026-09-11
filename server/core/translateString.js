const { protectCodes, restoreCodes } = require('../engines/rpgmaker/escapeCodes');
const { hasTranslatableCharacters } = require('../engines/rpgmaker/textFilter');

const MAX_TRANSLATABLE_LENGTH = 4900;
const MAX_ATTEMPTS = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanupTranslatedText(text) {
  return text
    .replace(/<\s*(.*?)\s*>/g, '<$1>')
    .replace(/\s+([?!.,;:])/g, '$1')
    .replace(/ +/g, ' ')
    .trim();
}

async function translateString({ text, provider, sourceLang, targetLang, cache, relayThroughEnglish, onLog }) {
  if (typeof text !== 'string') return text;

  const trimmed = text.trim();
  if (!trimmed || !hasTranslatableCharacters(trimmed)) return text;

  const cached = cache.get(text);
  if (cached !== undefined) return cached;

  const leadingSpace = text.slice(0, text.length - text.trimStart().length);
  const trailingSpace = text.slice(text.trimEnd().length);

  const { protectedText, placeholders } = protectCodes(trimmed);
  if (protectedText.length > MAX_TRANSLATABLE_LENGTH) return text;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      let result;
      if (relayThroughEnglish) {
        const english = await provider.translate(protectedText, sourceLang, 'EN');
        result = await provider.translate(english, 'EN', targetLang);
      } else {
        result = await provider.translate(protectedText, sourceLang, targetLang);
      }

      const restored = restoreCodes(result, placeholders);
      const finalText = `${leadingSpace}${cleanupTranslatedText(restored)}${trailingSpace}`;

      cache.set(text, finalText);
      if (onLog) onLog(text, finalText);
      return finalText;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        if (onLog) onLog(text, null, error);
        return text;
      }
      await sleep(1000 * attempt);
    }
  }

  return text;
}

module.exports = { translateString };
