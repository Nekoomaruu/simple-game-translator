// Ren'Py punya 3 elemen sintaks yang tidak boleh ikut diterjemahkan atau
// diubah urutannya: text tag {b}...{/b}, interpolasi data [variable],
// dan escape sequence (\n, \", dll). Modul ini memakai pola yang sama
// dengan engines/rpgmaker/escapeCodes.js: ganti tiap elemen dengan
// placeholder aman-ASCII sebelum translate, lalu kembalikan setelahnya.
//
// Kasus yang SENGAJA tidak ditangani (di luar cakupan modul ini):
//   - text tag bersarang dengan argumen kompleks berisi tanda kutip
//   - custom text tag yang didefinisikan lewat config.custom_text_tags
//     (modul ini memperlakukannya sama seperti tag bawaan, itu aman
//     karena kita cuma melindungi bentuknya, bukan mem-parsing artinya)

// Interpolasi [..] bisa berisi ekspresi Python dengan bracket bersarang,
// misalnya [player.names[0]] atau [items[i].name]. Regex non-greedy biasa
// cuma menangkap bracket paling dalam. Fungsi ini menangkap SELURUH
// interpolasi (termasu nested bracket) sebagai satu unit utuh, dengan
// depth-counting manual alih-alih regex murni untuk kasus ini.
function extractBalancedBracketTokens(text) {
  const tokens = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '[' && text[i + 1] === '[') { i += 1; continue; } // literal [[ , bukan interpolasi
    if (ch === ']' && text[i - 1] === ']' && depth === 0) continue;

    if (ch === '[') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (ch === ']') {
      depth = Math.max(0, depth - 1);
      if (depth === 0 && start !== -1) {
        tokens.push(text.slice(start, i + 1));
        start = -1;
      }
    }
  }

  return tokens;
}

const RENPY_TOKEN_PATTERN = /(\[\[|\]\]|\{\{|\}\}|\{\/?[a-zA-Z][^}]*\}|\\[nN"'\\%])/g;

const PLACEHOLDER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function placeholderFor(index) {
  const c1 = PLACEHOLDER_ALPHABET[Math.floor(index / 676) % 26];
  const c2 = PLACEHOLDER_ALPHABET[Math.floor(index / 26) % 26];
  const c3 = PLACEHOLDER_ALPHABET[index % 26];
  return `RPYX${c1}${c2}${c3}`;
}

function protectRenpyTokens(text) {
  const placeholders = {};
  const bracketTokens = extractBalancedBracketTokens(text);
  const otherTokens = text.match(RENPY_TOKEN_PATTERN) || [];
  const allTokens = [...new Set([...bracketTokens, ...otherTokens])].sort((a, b) => b.length - a.length);

  let working = text;
  allTokens.forEach((token, i) => {
    const key = placeholderFor(i);
    working = working.split(token).join(` ${key} `);
    placeholders[key] = token;
  });

  return { protectedText: working, placeholders };
}

function restoreRenpyTokens(text, placeholders) {
  let working = text;
  const keys = Object.keys(placeholders).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    const value = placeholders[key];
    const spaced = ` ${key} `;
    if (working.includes(spaced)) {
      working = working.split(spaced).join(value);
      continue;
    }
    if (working.includes(key)) {
      working = working.split(key).join(value);
    }
  }

  return working.replace(/ +/g, ' ').trim();
}

module.exports = { protectRenpyTokens, restoreRenpyTokens };
    
