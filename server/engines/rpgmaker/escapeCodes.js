const ESCAPE_PATTERN = /(\\[A-Za-z0-9_]+(?:\[[^\]]*\])?|\x1b[A-Za-z0-9_]+(?:\[[^\]]*\])?|\\[^a-zA-Z0-9\s]|<[^>]+>|%[A-Za-z0-9_]+|\{[^}]+\}|\[[^\]]+\])/g;

const PLACEHOLDER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function placeholderFor(index) {
  const c1 = PLACEHOLDER_ALPHABET[Math.floor(index / 676) % 26];
  const c2 = PLACEHOLDER_ALPHABET[Math.floor(index / 26) % 26];
  const c3 = PLACEHOLDER_ALPHABET[index % 26];
  return `ZXZX${c1}${c2}${c3}`;
}

function protectCodes(text) {
  const placeholders = {};
  let working = text;

  if (working.includes('\n')) {
    placeholders.ZXZXNL = '\n';
    working = working.split('\n').join(' ZXZXNL ');
  }

  const matches = [...new Set(working.match(ESCAPE_PATTERN) || [])].sort((a, b) => b.length - a.length);
  matches.forEach((code, i) => {
    const key = placeholderFor(i);
    working = working.split(code).join(` ${key} `);
    placeholders[key] = code;
  });

  return { protectedText: working, placeholders };
}

function restoreCodes(text, placeholders) {
  let working = text;
  const keys = Object.keys(placeholders).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    const value = placeholders[key];
    const exact = ` ${key} `;
    if (working.includes(exact)) {
      working = working.split(exact).join(value);
      continue;
    }
    if (working.includes(key)) {
      working = working.split(key).join(value);
      continue;
    }
    const spacedPattern = new RegExp(` ?${key.split('').join('\\s*')} ?`, 'gi');
    working = working.replace(spacedPattern, value);
  }

  return working.replace(/ +/g, ' ');
}

module.exports = { protectCodes, restoreCodes };
