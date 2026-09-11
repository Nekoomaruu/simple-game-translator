const STORAGE_KEY = 'sgt.settings.v1';

const defaultSettings = {
  providerId: 'google',
  providers: {
    deepl: { apiKey: '' },
    google: {},
    'openai-compatible': { apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' }
  },
  sourceLang: 'EN',
  maxCharsPerLine: 74,
  sessionTokensUsed: 0
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultSettings);

    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultSettings),
      ...parsed,
      providers: {
        ...structuredClone(defaultSettings.providers),
        ...(parsed.providers || {})
      }
    };
  } catch {
    return structuredClone(defaultSettings);
  }
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function currentProviderConfig(settings) {
  return settings.providers[settings.providerId] || {};
}

const Storage = { loadSettings, saveSettings, currentProviderConfig };
