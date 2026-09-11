const LATIN_OR_KANA_PATTERN = /[a-zA-Z\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/;

const SKIPPED_KEYS = new Set([
  'charactername', 'facename', 'battlername', 'bgm', 'bgs', 'me', 'se',
  'iconindex', 'id', 'code', 'indent', 'switchid', 'variableid',
  'commoneventid', 'color', 'textcolor', 'blendmode', 'pitch', 'volume',
  'pan', 'speed', 'frequency', 'pattern', 'direction', 'filename',
  'battlebacktexture', 'tileid', 'note', 'notes', 'meta', 'x', 'y', 'z',
  'width', 'height', 'opacity', 'scrolling', 'price', 'amount', 'type',
  'file', 'graphic', 'image', 'images', 'texture', 'url', 'path',
  'animationid', 'scope', 'gtype', 'movetype', 'movespeed', 'movefrequency',
  'moveroute', 'conditions', 'tilesetnames', 'parallaxname',
  'battleback1name', 'battleback2name', 'bgname', 'picturename',
  'skillname', 'itemname', 'weaponname', 'armorname', 'secretdataname',
  'encryptionkey', 'locale', 'title1name', 'title2name', 'svbattlername',
  'victoryme', 'defeatme', 'gameoverme', 'formula', 'damage', 'elementid',
  'hittype', 'occasion', 'stypeid', 'wtypeid', 'atypeid', 'etypeid',
  'animation1id', 'animation2id', 'message1', 'message2', 'message3',
  'message4'
]);

const KEY_SUFFIXES_TO_SKIP = ['id', 'index', 'file', 'path', 'url', 'img', 'png', 'ogg', 'name'];

const KEY_SUFFIX_EXCEPTIONS = new Set([
  'name', 'displayname', 'nickname', 'title', 'gametitle', 'chaptername',
  'description', 'message'
]);

const BINARY_EXTENSIONS = new Set([
  '.png', '.ogg', '.wav', '.mp3', '.m4a', '.json', '.js', '.css',
  '.html', '.txt', '.bak', '.rpgmvp', '.rpgmvo'
]);

const CODE_LIKE_PATTERNS = [
  /^function\s*\(/, /^=>/, /^console\./, /^var\s+[a-zA-Z_]/,
  /^const\s+[a-zA-Z_]/, /^let\s+[a-zA-Z_]/, /^[A-Za-z0-9_]+\s*=\s*/,
  /^if\s*\(/, /^for\s*\(/, /^[a-zA-Z0-9]+_[a-zA-Z0-9_]+$/,
  /^[a-z]+[A-Z][a-zA-Z0-9]*$/,
  /\b[ab]\.(?:atk|def|mat|mdf|agi|luk|mhp|mmp|hp|mp|tp|level)\b/,
  /^[A-Z][a-zA-Z0-9_]*\.[A-Za-z0-9_]+/, /^\$[a-zA-Z_]/
];

function hasTranslatableCharacters(text) {
  return LATIN_OR_KANA_PATTERN.test(text);
}

function isPunctuationOnly(text) {
  return text.replace(/[\s\d\W_]+/g, '') === '';
}

function looksLikeCode(text) {
  return CODE_LIKE_PATTERNS.some((pattern) => pattern.test(text));
}

function hasBinaryExtension(text) {
  const lower = text.toLowerCase();
  for (const ext of BINARY_EXTENSIONS) {
    if (lower.endsWith(ext)) return true;
  }
  return false;
}

function isHexColor(text) {
  return /^#[0-9a-fA-F]{3,8}$/.test(text);
}

function isNumericOnly(text) {
  return /^[\d\s.\-+]+$/.test(text);
}

function isTranslatableField(key, value) {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed) return false;
  if (isPunctuationOnly(trimmed)) return false;
  if (!hasTranslatableCharacters(trimmed)) return false;
  if (looksLikeCode(trimmed)) return false;
  if (hasBinaryExtension(trimmed)) return false;
  if (isHexColor(trimmed)) return false;
  if (isNumericOnly(trimmed)) return false;

  if (key !== null && key !== undefined) {
    const keyLower = String(key).toLowerCase();
    if (SKIPPED_KEYS.has(keyLower)) return false;

    const matchesSkippedSuffix = KEY_SUFFIXES_TO_SKIP.some((suffix) => keyLower.endsWith(suffix));
    if (matchesSkippedSuffix && !KEY_SUFFIX_EXCEPTIONS.has(keyLower)) {
      return false;
    }
  }

  return true;
}

module.exports = { isTranslatableField, hasTranslatableCharacters };
  
