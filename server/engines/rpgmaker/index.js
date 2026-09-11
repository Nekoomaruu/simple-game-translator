const fs = require('fs');
const path = require('path');
const { walkJson } = require('./jsonWalker');
const { translatePluginsJs } = require('./pluginsJs');

function findDataFolder(projectRoot) {
  const direct = path.join(projectRoot, 'data');
  if (fs.existsSync(direct) && fs.statSync(direct).isDirectory()) return direct;

  const wwwData = path.join(projectRoot, 'www', 'data');
  if (fs.existsSync(wwwData) && fs.statSync(wwwData).isDirectory()) return wwwData;

  return null;
}

function findPluginsJs(projectRoot, dataFolder) {
  const parentJs = path.join(path.dirname(dataFolder), 'js', 'plugins.js');
  if (fs.existsSync(parentJs)) return parentJs;

  const rootJs = path.join(projectRoot, 'js', 'plugins.js');
  if (fs.existsSync(rootJs)) return rootJs;

  return null;
}

function detect(projectRoot) {
  return Boolean(findDataFolder(projectRoot));
}

function listSourceFiles(projectRoot) {
  const dataFolder = findDataFolder(projectRoot);
  if (!dataFolder) return [];

  const files = fs.readdirSync(dataFolder)
    .filter((name) => name.toLowerCase().endsWith('.json') && !name.toLowerCase().endsWith('.bak'))
    .map((name) => ({
      relativePath: path.join('data', name),
      absolutePath: path.join(dataFolder, name)
    }));

  const pluginsPath = findPluginsJs(projectRoot, dataFolder);
  if (pluginsPath) {
    files.push({
      relativePath: path.relative(projectRoot, pluginsPath),
      absolutePath: pluginsPath,
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
      
