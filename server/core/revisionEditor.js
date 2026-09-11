const fs = require('fs');

// Jalan dua kali: sekali untuk baca (extractTextEntries), sekali untuk
// tulis balik (applyTextEdits). Keduanya harus menghasilkan urutan path
// yang identik, makanya logic traversal-nya disatukan di sini.

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

function pathTrailToId(trail) {
  return trail.join('.');
}

function extractTextEntries(filePath) {
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

function applyTextEdits(filePath, edits) {
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

module.exports = { extractTextEntries, applyTextEdits };
  
