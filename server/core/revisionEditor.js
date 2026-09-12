const fs = require('fs');
const path = require('path');
const { parseTranslationBlocks } = require('../engines/renpy/blockParser');

// Dua strategi baca/tulis berbeda tergantung ekstensi file:
//   .json  -> traversal generik tiap field string (dipakai RPG Maker)
//   .rpy   -> parseTranslationBlocks dari engine Ren'Py (baris aktif saja,
//             baris komentar/sumber tidak pernah masuk daftar revisi)
// Keduanya menghasilkan bentuk entries yang sama: [{ id, text }], supaya
// endpoint dan UI Manual Revisi tidak perlu tahu bedanya sama sekali.

function walkForEntries(node, pathTrail, onLeafString) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => walkForEntries(item, [...pathTrail, i], onLeafString));
    return;
  }

  if (!node || typeof node !== 'object') return;

  for (const key of Object.keys(node)) {
    const value = node[key];
    const nextTrail = [...pathTrail, key];

    if (typeof value === 'string') {
      onLeafString(nextTrail, value);
    } else if (value && typeof value === 'object') {
      walkForEntries(value, nextTrail, onLeafString);
    }
  }
}

function walkForEntriesForWrite(node, pathTrail, onLeafString) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => {
      if (typeof item === 'string') {
        onLeafString([...pathTrail, i], item, (newValue) => {
          node[i] = newValue;
        });
      } else {
        walkForEntriesForWrite(item, [...pathTrail, i], onLeafString);
      }
    });
    return;
  }

  if (!node || typeof node !== 'object') return;

  for (const key of Object.keys(node)) {
    const value = node[key];
    const nextTrail = [...pathTrail, key];

    if (typeof value === 'string') {
      onLeafString(nextTrail, value, (newValue) => {
        node[key] = newValue;
      });
    } else if (value && typeof value === 'object') {
      walkForEntriesForWrite(value, nextTrail, onLeafString);
    }
  }
}

function pathTrailToId(trail) {
  return trail.join('.');
}

function extractJsonEntries(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) return [];

  const data = JSON.parse(raw);
  const entries = [];

  walkForEntries(data, [], (trail, value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    // Sama seperti filter translasi: lewati string yang murni angka/simbol,
    // karena itu bukan teks yang pernah diterjemahkan.
    if (!/[a-zA-Z\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff]/.test(trimmed)) return;

    entries.push({ id: pathTrailToId(trail), text: value });
  });

  return entries;
}

function applyJsonEdits(filePath, edits) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw);
  const editsById = new Map(edits.map((e) => [e.id, e.text]));
  let appliedCount = 0;

  walkForEntriesForWrite(data, [], (trail, currentValue, setValue) => {
    const id = pathTrailToId(trail);
    if (editsById.has(id)) {
      setValue(editsById.get(id));
      appliedCount += 1;
    }
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return appliedCount;
}

// Untuk .rpy, id entry dibuat dari nomor baris aktifnya (stabil selama file
// tidak ditambah/dikurangi baris di luar tool ini, yang memang tidak terjadi
// karena revisi hanya mengganti isi kutip, tidak pernah menambah/menghapus
// baris).
function extractRenpyEntries(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.trim()) return [];

  const { segments } = parseTranslationBlocks(raw);
  return segments.map((segment) => ({
    id: `line-${segment.activeLineIndex}`,
    text: segment.currentText
  }));
}

function escapeForRenpyString(text) {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function applyRenpyEdits(filePath, edits) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { lines, segments } = parseTranslationBlocks(raw);
  const editsById = new Map(edits.map((e) => [e.id, e.text]));
  let appliedCount = 0;

  for (const segment of segments) {
    const id = `line-${segment.activeLineIndex}`;
    if (!editsById.has(id)) continue;

    const newText = editsById.get(id);
    const keyword = segment.isStringsBlock ? 'new ' : '';
    lines[segment.activeLineIndex] =
      `${segment.activeIndent}${keyword}${segment.activeSpeakerPrefix}"${escapeForRenpyString(newText)}"${segment.activeSuffix}`;
    appliedCount += 1;
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  return appliedCount;
}

function extractTextEntries(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.rpy') return extractRenpyEntries(filePath);
  return extractJsonEntries(filePath);
}

function applyTextEdits(filePath, edits) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.rpy') return applyRenpyEdits(filePath, edits);
  return applyJsonEdits(filePath, edits);
}

module.exports = { extractTextEntries, applyTextEdits };
