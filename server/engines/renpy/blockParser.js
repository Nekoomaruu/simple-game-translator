// Format resmi Ren'Py untuk satu baris dialog dalam file translasi
// (digenerate oleh Ren'Py Launcher ke game/tl/<bahasa>/*.rpy):
//
//   translate indonesian ch1_308a744b:
//
//       # e "Teks asli, jangan diubah."
//       e "Teks yang tampil di game — ini yang perlu diterjemahkan."
//
// Baris berawalan "#" adalah teks sumber (referensi, Ren'Py sendiri yang
// menjaganya tetap sinkron dengan script asli). Baris tanpa "#" tepat di
// bawahnya adalah yang dibaca game — itu target translate kita.
//
// Dua bentuk baris dialog yang didukung:
//   "Teks narasi tanpa nama karakter."
//   nama_karakter "Teks yang diucapkan karakter."
// nama_karakter tidak diterjemahkan — hanya bagian dalam tanda kutip.
//
// SELAIN blok dialog di atas, Ren'Py juga punya blok "strings" terpisah
// untuk teks UI/menu (bukan dialog cerita) — dipakai untuk label tombol,
// pesan sistem, dsb yang sering berulang di banyak tempat:
//
//   translate indonesian strings:
//
//       old "Save"
//       new "Save"
//
//       old "Load"
//       new "Load"
//
// Beda dari blok dialog: satu blok "strings" bisa berisi BANYAK pasangan
// old/new (bukan cuma satu), tidak ada nama karakter, dan tidak ada baris
// "#" — baris "old" sendiri yang berfungsi sebagai referensi sumber, baris
// "new" adalah target translate.
//
// Kasus yang SENGAJA tidak ditangani:
//   - menu/pilihan (choice) dengan indentasi bersarang
//   - baris dengan lebih dari satu string per baris (mis. `"A" "B"` gabungan)
//   - string yang membentang lebih dari satu baris fisik

const { protectRenpyTokens, restoreRenpyTokens } = require('./tokenProtection');

const TRANSLATE_BLOCK_START = /^\s*translate\s+\w+\s+\w+:\s*$/;
const STRINGS_BLOCK_START = /^\s*translate\s+\w+\s+strings:\s*$/;
const OLD_LINE = /^(\s*)old\s+"((?:[^"\\]|\\.)*)"\s*$/;
const NEW_LINE = /^(\s*)new\s+"((?:[^"\\]|\\.)*)"\s*$/;

// Tangkap opsional nama karakter (identifier atau beberapa kata dipisah
// spasi/underscore) sebelum tanda kutip pembuka, lalu isi kutip itu sendiri.
const QUOTED_LINE = /^(\s*)((?:[a-zA-Z_][a-zA-Z0-9_ ]*\s+)?)"((?:[^"\\]|\\.)*)"\s*(\s+with\s+\w+)?\s*$/;

function parseQuotedLine(line, isCommentLine) {
  const workingLine = isCommentLine ? line.replace(/^(\s*)#\s?/, '$1') : line;
  const match = workingLine.match(QUOTED_LINE);
  if (!match) return null;

  return {
    indent: match[1],
    speakerPrefix: match[2] || '',
    text: match[3],
    suffix: match[4] || ''
  };
}

function parseStringsBlock(lines, blockStartIndex) {
  const segments = [];
  let cursor = blockStartIndex + 1;

  // Blok "strings" terus berisi pasangan old/new sampai ketemu baris yang
  // bukan bagian darinya (baris kosong berturutan lalu sesuatu yang lain,
  // atau blok translate/strings baru). Kita jalan selama pola old->new
  // masih cocok, melewati baris kosong dan baris komentar "# file:line" di
  // antaranya.
  while (cursor < lines.length) {
    while (cursor < lines.length && (lines[cursor].trim() === '' || /^\s*#/.test(lines[cursor]))) {
      cursor += 1;
    }

    const oldMatch = lines[cursor] && lines[cursor].match(OLD_LINE);
    if (!oldMatch) break;

    const newMatch = lines[cursor + 1] && lines[cursor + 1].match(NEW_LINE);
    if (!newMatch) break;

    segments.push({
      activeLineIndex: cursor + 1,
      sourceText: oldMatch[2],
      currentText: newMatch[2],
      activeIndent: newMatch[1],
      activeSpeakerPrefix: '',
      activeSuffix: '',
      isStringsBlock: true
    });

    cursor += 2;
  }

  return { segments, nextIndex: cursor };
}

function parseTranslationBlocks(sourceText) {
  const lines = sourceText.split('\n');
  const segments = [];
  let cursor = 0;

  while (cursor < lines.length) {
    if (STRINGS_BLOCK_START.test(lines[cursor])) {
      const result = parseStringsBlock(lines, cursor);
      segments.push(...result.segments);
      cursor = result.nextIndex;
      continue;
    }

    if (!TRANSLATE_BLOCK_START.test(lines[cursor])) {
      cursor += 1;
      continue;
    }

    let probe = cursor + 1;
    while (probe < lines.length && lines[probe].trim() === '') probe += 1;

    const commentLine = lines[probe];
    const activeLine = lines[probe + 1];

    const isCommentSyntax = commentLine !== undefined && /^\s*#/.test(commentLine);
    const parsedComment = isCommentSyntax ? parseQuotedLine(commentLine, true) : null;
    const parsedActive = activeLine !== undefined ? parseQuotedLine(activeLine, false) : null;

    if (parsedComment && parsedActive) {
      segments.push({
        activeLineIndex: probe + 1,
        sourceText: parsedComment.text,
        currentText: parsedActive.text,
        activeIndent: parsedActive.indent,
        activeSpeakerPrefix: parsedActive.speakerPrefix,
        activeSuffix: parsedActive.suffix,
        isStringsBlock: false
      });
      cursor = probe + 2;
    } else {
      cursor += 1;
    }
  }

  return { lines, segments };
}

function escapeForRenpyString(text) {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

async function translateRenpyFile(sourceText, translateOne) {
  const { lines, segments } = parseTranslationBlocks(sourceText);
  if (segments.length === 0) return null;

  for (const segment of segments) {
    const { protectedText, placeholders } = protectRenpyTokens(segment.sourceText);
    const translatedProtected = await translateOne(protectedText);
    const translated = restoreRenpyTokens(translatedProtected, placeholders);

    const keyword = segment.isStringsBlock ? 'new ' : '';
    lines[segment.activeLineIndex] =
      `${segment.activeIndent}${keyword}${segment.activeSpeakerPrefix}"${escapeForRenpyString(translated)}"${segment.activeSuffix}`;
  }

  return lines.join('\n');
}

module.exports = { parseTranslationBlocks, translateRenpyFile, parseQuotedLine };
      
