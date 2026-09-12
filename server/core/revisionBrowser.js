const fs = require('fs');
const path = require('path');
const { GAMES_ROOT, resolveGamePath } = require('./gamesRoot');

function listTranslatedFolders() {
  return fs.readdirSync(GAMES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.includes('_indo'))
    .map((entry) => entry.name)
    .sort();
}

const REVISABLE_EXTENSIONS = new Set(['.json', '.rpy']);

function listRevisableFilesRecursive(rootPath, currentPath = rootPath) {
  const results = [];

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...listRevisableFilesRecursive(rootPath, fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (REVISABLE_EXTENSIONS.has(ext)) {
        results.push(path.relative(rootPath, fullPath));
      }
    }
  }

  return results;
}

function resolveTranslatedFile(folderName, relativeFilePath) {
  const folderPath = resolveGamePath(folderName);
  const filePath = path.resolve(folderPath, relativeFilePath);

  const isInsideFolder = filePath === folderPath || filePath.startsWith(`${folderPath}${path.sep}`);
  if (!isInsideFolder) {
    throw new Error('File di luar folder hasil translate tidak diperbolehkan.');
  }

  return filePath;
}

module.exports = { listTranslatedFolders, listRevisableFilesRecursive, resolveTranslatedFile };
