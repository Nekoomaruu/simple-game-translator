function smartSplitTranslatedText(translatedText, maxCharsPerLine) {
  if (!translatedText) return [''];

  const normalized = translatedText.trim().replace(/\s+/g, ' ');
  const words = normalized.split(' ');

  const lines = [];
  let current = '';

  for (let word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    while (word.length > maxCharsPerLine) {
      lines.push(word.slice(0, maxCharsPerLine));
      word = word.slice(maxCharsPerLine);
    }
    current = word;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

module.exports = { smartSplitTranslatedText };
