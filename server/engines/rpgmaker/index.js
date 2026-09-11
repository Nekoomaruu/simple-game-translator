const fs = require('fs');
const path = require('path');
const { walkJson } = require('./jsonWalker');
const { translatePluginsJs } = require('./pluginsJs');

function findDataFolders(projectRoot) {
  const found = [];

  const wwwData = path.join(projectRoot, 'www', 'data');
  if (fs.existsSync(wwwData) && fs.statSync(wwwData).isDirectory()) {
    found.push({ absolutePath: wwwData, relativeBase: path.join('www', 'data') });
  }

  const directData = path.join(projectRoot, 'data');
  if (fs.existsSync(directData) && fs.statSync(directData).isDirectory()) {
    found.push({ absolutePath: directData, relativeBase: 'data' });
  }

  return found;
}

function findPluginsFiles(projectRoot) {
  const found = [];

  const wwwPlugins = path.join(projectRoot, 'www', 'js', 'plugins.js');
  if (fs.existsSync(wwwPlugins)) {
    found.push({ absolutePath: wwwPlugins, relativePath: path.join('www', 'js', 'plugins.js') });
  }

  const rootPlugins = path.join(projectRoot, 'js', 'plugins.js');
  if (fs.existsSync(rootPlugins)) {
    found.push({ absolutePath: rootPlugins, relativePath: path.join('js', 'plugins.js') });
  }

  return found;
}

function detect(projectRoot) {
  return findDataFolders(projectRoot).length > 0;
}

function listSourceFiles(projectRoot) {
  const dataFolders = findDataFolders(projectRoot);
  const files = [];

  for (const folder of dataFolders) {
    const jsonFiles = fs.readdirSync(folder.absolutePath)
      .filter((name) => name.toLowerCase().endsWith('.json') && !name.toLowerCase().endsWith('.bak'))
      .map((name) => ({
        relativePath: path.join(folder.relativeBase, name),
        absolutePath: path.join(folder.absolutePath, name)
      }));
    files.push(...jsonFiles);
  }

  for (const plugin of findPluginsFiles(projectRoot)) {
    files.push({
      relativePath: plugin.relativePath,
      absolutePath: plugin.absolutePath,
      isPluginsJs: true
    });
  }

  return files;
}

async function translateFile(file, translateOne, options) {
  if (file.isPluginsJs) {
    const source = fs.readFileSync(file.absolutePath, 'utf8');
    const translated = await translatePluginsJs(source, translateOne);
    return translated === null ? source : translated;
  }

  const raw = fs.readFileSync(file.absolutePath, 'utf8');
  if (!raw.trim()) return raw;

  const data = JSON.parse(raw);
  await walkJson(data, null, translateOne, options);
  return JSON.stringify(data, null, 2);
}

module.exports = {
  id: 'rpgmaker',
  label: 'RPG Maker MV / MZ',
  detect,
  listSourceFiles,
  translateFile
};
