const { DeepLProvider } = require('./deepl');
const { GoogleTranslateProvider } = require('./googleTranslate');
const { OpenAICompatibleProvider } = require('./openaiCompatible');

const PROVIDERS = {
  deepl: {
    label: 'DeepL',
    requiresApiKey: true,
    supportsUsageCheck: true,
    usageKind: 'characters',
    create: (config) => new DeepLProvider(config)
  },
  google: {
    label: 'Google Translate',
    requiresApiKey: false,
    supportsUsageCheck: false,
    create: (config) => new GoogleTranslateProvider(config)
  },
  'openai-compatible': {
    label: 'OpenAI-compatible (OpenAI, OpenRouter, LM Studio, ...)',
    requiresApiKey: true,
    requiresBaseUrl: true,
    requiresModel: true,
    supportsUsageCheck: false,
    tracksTokensPerSession: true,
    create: (config) => new OpenAICompatibleProvider(config)
  }
};

function listProviders() {
  return Object.entries(PROVIDERS).map(([id, info]) => ({
    id,
    label: info.label,
    requiresApiKey: info.requiresApiKey,
    requiresBaseUrl: Boolean(info.requiresBaseUrl),
    requiresModel: Boolean(info.requiresModel),
    supportsUsageCheck: Boolean(info.supportsUsageCheck),
    usageKind: info.usageKind || null,
    tracksTokensPerSession: Boolean(info.tracksTokensPerSession)
  }));
}

function createProvider(id, config) {
  const entry = PROVIDERS[id];
  if (!entry) {
    throw new Error(`Unknown translation provider: ${id}`);
  }
  return entry.create(config);
}

module.exports = { listProviders, createProvider };
