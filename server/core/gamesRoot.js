const fs = require('fs');
const path = require('path');

const GAMES_ROOT = path.join(__dirname, '..', '..', 'games');

function ensureGamesRootExists() {
  fs.mkdirSync(GAMES_ROOT, { recursive: true });
}

function listGameFolders() {
  ensureGamesRootExists();
  return fs.readdirSync(GAMES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

function resolveGamePath(folderName) {
  const resolved = path.resolve(GAMES_ROOT, folderName);
  const isInsideGamesRoot = resolved === GAMES_ROOT || resolved.startsWith(`${GAMES_ROOT}${path.sep}`);

  if (!isInsideGamesRoot) {
    throw new Error('Folder di luar direktori games/ tidak diperbolehkan.');
  }

  return resolved;
}

module.exports = { GAMES_ROOT, ensureGamesRootExists, listGameFolders, resolveGamePath };
