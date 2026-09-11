const { walkJson } = require('./jsonWalker');

function extractPluginsArray(source) {
  const varIndex = source.indexOf('var $plugins');
  if (varIndex === -1) return null;

  const start = source.indexOf('[', varIndex);
  const end = source.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) return null;

  return { start, end, jsonText: source.slice(start, end + 1) };
}

async function translatePluginsJs(sourceCode, translateOne) {
  const located = extractPluginsArray(sourceCode);
  if (!located) return null;

  const plugins = JSON.parse(located.jsonText);

  const protectedNames = plugins.map((plugin) => plugin.name);
  const protectedParams = plugins.map((plugin) => plugin.parameters);
  plugins.forEach((plugin) => {
    delete plugin.name;
    delete plugin.parameters;
  });

  await walkJson(plugins, null, translateOne);

  plugins.forEach((plugin, i) => {
    plugin.name = protectedNames[i];
    plugin.parameters = protectedParams[i];
  });

  const newJsonText = JSON.stringify(plugins, null, 2);
  return sourceCode.slice(0, located.start) + newJsonText + sourceCode.slice(located.end + 1);
}

module.exports = { translatePluginsJs };
          
