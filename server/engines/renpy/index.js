const fs = require('fs');
const path = require('path');
const { translateRenpyFile } = require('./blockParser');

// Ren'Py punya sistem translasi bawaan: file .rpy di dalam game/tl/<bahasa>/
// digenerate lewat Ren'Py Launcher ("Generate Translations"), BUKAN ditulis
// manual dari nol. Alur yang diasumsikan tool ini:
//   1. Pengguna generate (atau decompile manual dari .rpyc) folder
//      tl/<bahasa>/ dulu, di luar tool ini.
//   2. Tool ini membaca file .rpy di folder tl/<bahasa>/ itu dan mengisi
//      baris aktif dengan hasil translate; baris komentar/old (sumber)
//      dibiarkan utuh.
//
// Sebuah project bisa punya LEBIH DARI SATU folder tl/<bahasa>/ sekaligus
// (mis. tl/en/, tl/french/, tl/indonesian/ berdampingan) — umum terjadi
// kalau pengguna menimpa langsung folder bahasa asli game (mis. tl/en/)
// alih-alih membuat folder baru. Karena itu detect()/listSourceFiles()
// menerima parameter opsional languageFolder untuk memilih folder mana
// yang diproses; kalau tidak diisi, folder pertama yang ditemukan dipakai
// (mempertahankan perilaku lama untuk pemanggil yang belum tahu soal ini).
//
// Lihat blockParser.js untuk parser blok translate dan penanganan baris
// berkarakter, dan tokenProtection.js untuk proteksi {tag} dan [variabel].

function findTlRoot(projectRoot) {
  const candidates = [
    path.join(projectRoot, 'game', 'tl'),
    path.join(projectRoot, 'tl')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) || null;
}

function listAvailableLanguages(projectRoot) {
  const tlRoot = findTlRoot(projectRoot);
  if (!tlRoot) return [];

  return fs.readdirSync(tlRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

function resolveLanguageFolder(projectRoot, languageFolder) {
  const tlRoot = findTlRoot(projectRoot);
  if (!tlRoot) return null;

  const targetName = languageFolder || listAvailableLanguages(projectRoot)[0];
  if (!targetName) return null;

  const candidate = path.join(tlRoot, targetName);
  return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory() ? candidate : null;
}

function detect(projectRoot) {
  return listAvailableLanguages(projectRoot).length > 0;
}

function listSourceFiles(projectRoot, options = {}) {
  const languageFolderPath = resolveLanguageFolder(projectRoot, options.languageFolder);
  if (!languageFolderPath) return [];

  return fs.readdirSync(languageFolderPath)
    .filter((name) => name.toLowerCase().endsWith('.rpy'))
    .map((name) => ({
      relativePath: path.relative(projectRoot, path.join(languageFolderPath, name)),
      absolutePath: path.join(languageFolderPath, name)
    }));
}

async function translateFile(file, translateOne) {
  const raw = fs.readFileSync(file.absolutePath, 'utf8');
  const translated = await translateRenpyFile(raw, translateOne);
  return translated === null ? raw : translated;
}

module.exports = {
  id: 'renpy',
  label: "Ren'Py",
  detect,
  listSourceFiles,
  translateFile,
  listAvailableLanguages
};

