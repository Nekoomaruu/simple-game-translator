const { isTranslatableField } = require('./textFilter');
const { processEventListWithMerging } = require('./eventListProcessor');
const {
  SHOW_CHOICES,
  CHANGE_NAME_INPUT,
  WHEN_SELECTED,
  PLAIN_STRING_PARAM_CODES,
  UNSAFE_CODES,
  SHOW_TEXT,
  SHOW_TEXT_MULTILINE
} = require('./eventCodes');

function looksLikeAudioClip(node) {
  return node && 'volume' in node && 'pitch' in node && 'name' in node;
}

function isEventCommand(node) {
  return node && 'code' in node && Array.isArray(node.parameters);
}

async function translateEventCommandParameters(command, translateOne) {
  const { code, parameters } = command;

  if (UNSAFE_CODES.has(code) || code === SHOW_TEXT || code === SHOW_TEXT_MULTILINE) {
    return;
  }

  if (code === CHANGE_NAME_INPUT) {
    if (typeof parameters[4] === 'string' && parameters[4].trim()) {
      parameters[4] = await translateOne(parameters[4]);
    }
    return;
  }

  if (code === SHOW_CHOICES && Array.isArray(parameters[0])) {
    const choices = parameters[0];
    for (let i = 0; i < choices.length; i += 1) {
      if (typeof choices[i] === 'string') {
        choices[i] = await translateOne(choices[i]);
      }
    }
    return;
  }

  if (code === WHEN_SELECTED && typeof parameters[1] === 'string') {
    parameters[1] = await translateOne(parameters[1]);
    return;
  }

  if (PLAIN_STRING_PARAM_CODES.has(code)) {
    for (let i = 0; i < parameters.length; i += 1) {
      if (typeof parameters[i] === 'string') {
        parameters[i] = await translateOne(parameters[i]);
      }
    }
    return;
  }

  for (let i = 0; i < parameters.length; i += 1) {
    const value = parameters[i];

    if (typeof value === 'string') {
      const nested = tryParseEmbeddedJson(value);
      if (nested !== null) {
        await walkJson(nested, 'parameters', translateOne);
        parameters[i] = JSON.stringify(nested);
        continue;
      }
      if (isTranslatableField('parameters', value)) {
        parameters[i] = await translateOne(value);
      }
    } else if (value && typeof value === 'object') {
      await walkJson(value, 'parameters', translateOne);
    }
  }
}

function tryParseEmbeddedJson(value) {
  const trimmed = value.trim();
  const looksLikeObject = trimmed.startsWith('{') && trimmed.endsWith('}');
  const looksLikeArray = trimmed.startsWith('[') && trimmed.endsWith(']');
  if (!looksLikeObject && !looksLikeArray) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

async function walkJson(node, parentKey, translateOne, options = {}) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      const item = node[i];
      if (typeof item === 'string' && isTranslatableField(parentKey, item)) {
        node[i] = await translateOne(item);
      } else if (item && typeof item === 'object') {
        await walkJson(item, parentKey, translateOne, options);
      }
    }
    return;
  }

  if (!node || typeof node !== 'object') return;
  if (looksLikeAudioClip(node)) return;

  if (Array.isArray(node.list)) {
    await processEventListWithMerging(node.list, {
      translateOne,
      maxCharsPerLine: options.maxCharsPerLine || 74,
      joinWithoutSpace: options.joinWithoutSpace || false
    });
  }

  if (isEventCommand(node)) {
    await translateEventCommandParameters(node, translateOne);
    return;
  }

  for (const key of Object.keys(node)) {
    const keyLower = key.toLowerCase();
    if (keyLower === 'note' || keyLower === 'notes' || keyLower === 'meta') continue;

    const value = node[key];
    if (typeof value === 'string') {
      const nested = tryParseEmbeddedJson(value);
      if (nested !== null) {
        await walkJson(nested, key, translateOne, options);
        node[key] = JSON.stringify(nested);
        continue;
      }
      if (isTranslatableField(key, value)) {
        node[key] = await translateOne(value);
      }
    } else if (value && typeof value === 'object') {
      await walkJson(value, key, translateOne, options);
    }
  }
}

module.exports = { walkJson };
