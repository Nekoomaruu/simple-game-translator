const Dashboard = (() => {
  let providersInfo = [];

  const el = {};

  function cacheElements() {
    el.providerSelect = document.getElementById('providerSelect');
    el.apiKeyGroup = document.getElementById('apiKeyGroup');
    el.apiKey = document.getElementById('apiKey');
    el.baseUrlGroup = document.getElementById('baseUrlGroup');
    el.baseUrl = document.getElementById('baseUrl');
    el.modelGroup = document.getElementById('modelGroup');
    el.modelName = document.getElementById('modelName');
    el.verifyBtn = document.getElementById('verifyBtn');
    el.checkUsageBtn = document.getElementById('checkUsageBtn');
    el.verifyResult = document.getElementById('verifyResult');
    el.sourceLang = document.getElementById('sourceLang');
    el.maxChars = document.getElementById('maxChars');
    el.usageDeeplUsed = document.getElementById('usageDeeplUsed');
    el.usageDeeplLimit = document.getElementById('usageDeeplLimit');
    el.usageTokens = document.getElementById('usageTokens');
    el.activeProviderLabel = document.getElementById('activeProviderLabel');
  }

  function activeProviderInfo() {
    return providersInfo.find((p) => p.id === el.providerSelect.value);
  }

  function fieldsForProvider(providerId) {
    return providersInfo.find((p) => p.id === providerId);
  }

  function persistFromForm() {
    const settings = Storage.loadSettings();
    settings.providerId = el.providerSelect.value;
    settings.providers[settings.providerId] = {
      apiKey: el.apiKey.value.trim(),
      baseUrl: el.baseUrl.value.trim(),
      model: el.modelName.value.trim()
    };
    settings.sourceLang = el.sourceLang.value;
    settings.maxCharsPerLine = Number(el.maxChars.value) || 74;
    Storage.saveSettings(settings);
    updateSidebarLabel(settings);
  }

  function updateSidebarLabel(settings) {
    const info = fieldsForProvider(settings.providerId);
    el.activeProviderLabel.textContent = `provider: ${info ? info.label.split(' ')[0] : settings.providerId}`;
  }

  function applyProviderVisibility() {
    const info = activeProviderInfo();
    if (!info) return;
    el.apiKeyGroup.hidden = !info.requiresApiKey;
    el.baseUrlGroup.hidden = !info.requiresBaseUrl;
    el.modelGroup.hidden = !info.requiresModel;
    el.checkUsageBtn.hidden = !info.supportsUsageCheck;
    el.verifyResult.textContent = '';
    el.verifyResult.removeAttribute('data-state');
  }

  function fillFormFromSettings(settings) {
    el.providerSelect.value = settings.providerId;
    applyProviderVisibility();

    const config = Storage.currentProviderConfig(settings);
    el.apiKey.value = config.apiKey || '';
    el.baseUrl.value = config.baseUrl || 'https://api.openai.com/v1';
    el.modelName.value = config.model || 'gpt-4o-mini';
    el.sourceLang.value = settings.sourceLang;
    el.maxChars.value = settings.maxCharsPerLine;

    el.usageTokens.textContent = settings.sessionTokensUsed || 0;
    updateSidebarLabel(settings);
  }

  async function loadProviders() {
    const response = await fetch('/api/providers');
    providersInfo = await response.json();
    el.providerSelect.innerHTML = providersInfo
      .map((p) => `<option value="${p.id}">${p.label}</option>`)
      .join('');
  }

  function currentConfigPayload() {
    return {
      apiKey: el.apiKey.value.trim(),
      baseUrl: el.baseUrl.value.trim(),
      model: el.modelName.value.trim()
    };
  }

  async function verifyProvider() {
    el.verifyResult.textContent = 'Menguji...';
    el.verifyResult.removeAttribute('data-state');

    try {
      const response = await fetch('/api/provider/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: el.providerSelect.value, config: currentConfigPayload() })
      });
      const payload = await response.json();

      if (payload.ok) {
        el.verifyResult.textContent = 'Terhubung';
        el.verifyResult.dataset.state = 'ok';
      } else {
        el.verifyResult.textContent = payload.error || 'Gagal terhubung';
        el.verifyResult.dataset.state = 'error';
      }
    } catch (error) {
      el.verifyResult.textContent = error.message;
      el.verifyResult.dataset.state = 'error';
    }
  }

  async function checkUsage() {
    el.verifyResult.textContent = 'Mengambil data kuota...';
    el.verifyResult.removeAttribute('data-state');

    try {
      const response = await fetch('/api/provider/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: el.providerSelect.value, config: currentConfigPayload() })
      });
      const payload = await response.json();

      if (!payload.ok) {
        el.verifyResult.textContent = payload.error || 'Gagal mengambil kuota';
        el.verifyResult.dataset.state = 'error';
        return;
      }

      el.verifyResult.textContent = 'Kuota diperbarui';
      el.verifyResult.dataset.state = 'ok';

      if (payload.usage.kind === 'characters') {
        el.usageDeeplUsed.textContent = payload.usage.used.toLocaleString('id-ID');
        el.usageDeeplLimit.textContent = `dari ${payload.usage.limit.toLocaleString('id-ID')} karakter/bulan`;
      }
    } catch (error) {
      el.verifyResult.textContent = error.message;
      el.verifyResult.dataset.state = 'error';
    }
  }

  function addSessionTokens(count) {
    if (!count) return;
    const settings = Storage.loadSettings();
    settings.sessionTokensUsed = (settings.sessionTokensUsed || 0) + count;
    Storage.saveSettings(settings);
    el.usageTokens.textContent = settings.sessionTokensUsed;
  }

  function bindEvents() {
    el.providerSelect.addEventListener('change', () => {
      applyProviderVisibility();
      const settings = Storage.loadSettings();
      const config = settings.providers[el.providerSelect.value] || {};
      el.apiKey.value = config.apiKey || '';
      el.baseUrl.value = config.baseUrl || 'https://api.openai.com/v1';
      el.modelName.value = config.model || 'gpt-4o-mini';
      persistFromForm();
    });

    [el.apiKey, el.baseUrl, el.modelName, el.sourceLang, el.maxChars].forEach((input) => {
      input.addEventListener('change', persistFromForm);
    });

    el.verifyBtn.addEventListener('click', verifyProvider);
    el.checkUsageBtn.addEventListener('click', checkUsage);
  }

  async function init() {
    cacheElements();
    await loadProviders();
    fillFormFromSettings(Storage.loadSettings());
    bindEvents();
  }

  return { init, addSessionTokens, get providersInfo() { return providersInfo; } };
})();
      
