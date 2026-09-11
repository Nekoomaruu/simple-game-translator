const fs = require('fs');
const path = require('path');
const { GAMES_ROOT, resolveGamePath } = require('./gamesRoot');

function listTranslatedFolders() {
  return fs.readdirSync(GAMES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.includes('_indo'))
    .map((entry) => entry.name)
    .sort();
}

function listJsonFilesRecursive(rootPath, currentPath = rootPath) {
  const results = [];

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const fullPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      results.push(...listJsonFilesRecursive(rootPath, fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      results.push(path.relative(rootPath, fullPath));
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

module.exports = { listTranslatedFolders, listJsonFilesRecursive, resolveTranslatedFile };
    
