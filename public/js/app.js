const state = {
  engineId: null,
  providers: [],
};

const el = {
  folderSelect: document.getElementById('folderSelect'),
  inspectBtn: document.getElementById('inspectBtn'),
  inspectResult: document.getElementById('inspectResult'),
  engineLabel: document.getElementById('engineLabel'),
  sourceLang: document.getElementById('sourceLang'),
  maxChars: document.getElementById('maxChars'),
  providerSelect: document.getElementById('providerSelect'),
  apiKeyGroup: document.getElementById('apiKeyGroup'),
  apiKey: document.getElementById('apiKey'),
  baseUrlGroup: document.getElementById('baseUrlGroup'),
  baseUrl: document.getElementById('baseUrl'),
  modelGroup: document.getElementById('modelGroup'),
  modelName: document.getElementById('modelName'),
  verifyBtn: document.getElementById('verifyBtn'),
  verifyResult: document.getElementById('verifyResult'),
  startBtn: document.getElementById('startBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  progressLabel: document.getElementById('progressLabel'),
  progressFill: document.getElementById('progressFill'),
  logStream: document.getElementById('logStream'),
};

let currentJobId = null;
let currentEventSource = null;
let totalFilesInJob = 0;
let filesDoneInJob = 0;

function appendLog(kind, tag, body) {
  const line = document.createElement('div');
  line.className = 'log-line';
  line.dataset.kind = kind;

  const tagEl = document.createElement('span');
  tagEl.className = 'log-line-tag';
  tagEl.textContent = tag;

  const bodyEl = document.createElement('span');
  bodyEl.className = 'log-line-body';
  bodyEl.innerHTML = body;

  line.append(tagEl, bodyEl);
  el.logStream.appendChild(line);
  el.logStream.scrollTop = el.logStream.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}

async function loadGameFolders() {
  const response = await fetch('/api/games');
  const payload = await response.json();

  if (payload.folders.length === 0) {
    el.folderSelect.innerHTML = '<option value="">(kosong — taruh project di folder games/)</option>';
    el.inspectBtn.disabled = true;
    return;
  }

  el.folderSelect.innerHTML = payload.folders
    .map((name) => `<option value="${name}">${name}</option>`)
    .join('');
  el.inspectBtn.disabled = false;
}

async function loadDefaultsFromConfig() {
  const response = await fetch('/api/config');
  const config = await response.json();

  el.sourceLang.value = config.translation.sourceLang || 'EN';
  el.maxChars.value = config.translation.maxCharsPerLine || 74;

  if (config.defaultProvider) {
    el.providerSelect.value = config.defaultProvider;
    updateProviderFields();
  }

  const providerDefaults = config.providers[el.providerSelect.value];
  if (providerDefaults) {
    if (providerDefaults.apiKey) el.apiKey.value = providerDefaults.apiKey;
    if (providerDefaults.baseUrl) el.baseUrl.value = providerDefaults.baseUrl;
    if (providerDefaults.model) el.modelName.value = providerDefaults.model;
  }

  if (config.usingExampleConfig) {
    appendLog('file', 'config', 'Memakai config.example.js — salin jadi config.js untuk menyimpan API key default kamu.');
  }
}

async function loadProviders() {
  const response = await fetch('/api/providers');
  state.providers = await response.json();

  el.providerSelect.innerHTML = state.providers
    .map((p) => `<option value="${p.id}">${p.label}</option>`)
    .join('');

  updateProviderFields();
}

function updateProviderFields() {
  const provider = state.providers.find((p) => p.id === el.providerSelect.value);
  if (!provider) return;

  el.apiKeyGroup.hidden = !provider.requiresApiKey;
  el.baseUrlGroup.hidden = !provider.requiresBaseUrl;
  el.modelGroup.hidden = !provider.requiresModel;
  el.verifyResult.textContent = '';
  el.verifyResult.removeAttribute('data-state');
}

function currentProviderConfig() {
  return {
    apiKey: el.apiKey.value.trim(),
    baseUrl: el.baseUrl.value.trim(),
    model: el.modelName.value.trim(),
  };
}

async function inspectFolder() {
  const folderName = el.folderSelect.value;
  if (!folderName) return;

  el.inspectResult.textContent = 'Membaca folder...';
  el.startBtn.disabled = true;
  state.engineId = null;
  el.engineLabel.textContent = '—';
  el.engineLabel.classList.remove('pill-active');

  try {
    const response = await fetch('/api/project/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderName }),
    });
    const payload = await response.json();

    if (!response.ok) {
      el.inspectResult.textContent = payload.error || 'Gagal membaca folder.';
      return;
    }

    state.engineId = payload.engineId;
    el.engineLabel.textContent = payload.engineLabel;
    el.engineLabel.classList.add('pill-active');
    el.inspectResult.textContent = `${payload.fileCount} file terdeteksi untuk diterjemahkan.`;
    el.startBtn.disabled = false;
  } catch (error) {
    el.inspectResult.textContent = `Gagal: ${error.message}`;
  }
}

async function verifyProvider() {
  el.verifyResult.textContent = 'Menguji...';
  el.verifyResult.removeAttribute('data-state');

  try {
    const response = await fetch('/api/provider/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: el.providerSelect.value,
        config: currentProviderConfig(),
      }),
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

function setRunningUI(isRunning) {
  el.startBtn.hidden = isRunning;
  el.cancelBtn.hidden = !isRunning;
  el.inspectBtn.disabled = isRunning;
  el.folderSelect.disabled = isRunning;
}

function updateProgress() {
  const percent = totalFilesInJob === 0 ? 0 : Math.round((filesDoneInJob / totalFilesInJob) * 100);
  el.progressFill.style.width = `${percent}%`;
  el.progressLabel.textContent = `${filesDoneInJob} / ${totalFilesInJob} file — ${percent}%`;
}

async function startTranslation() {
  if (!state.engineId) return;

  el.logStream.innerHTML = '';
  totalFilesInJob = 0;
  filesDoneInJob = 0;
  updateProgress();
  setRunningUI(true);

  const response = await fetch('/api/translate/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      folderName: el.folderSelect.value,
      engineId: state.engineId,
      providerId: el.providerSelect.value,
      providerConfig: currentProviderConfig(),
      sourceLang: el.sourceLang.value,
      targetLang: 'ID',
      relayThroughEnglish: el.sourceLang.value === 'JA',
      maxCharsPerLine: Number(el.maxChars.value) || 74,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    appendLog('fail', 'error', escapeHtml(payload.error || 'Gagal memulai proses.'));
    setRunningUI(false);
    return;
  }

  currentJobId = payload.jobId;
  appendLog('file', 'cache', `${payload.cacheEntriesLoaded} entri cache dimuat.`);
  appendLog('file', 'output', escapeHtml(payload.outputRoot));

  currentEventSource = new EventSource(`/api/translate/stream/${currentJobId}`);

  currentEventSource.addEventListener('start', (event) => {
    const data = JSON.parse(event.data);
    totalFilesInJob = data.totalFiles;
    updateProgress();
  });

  currentEventSource.addEventListener('file-start', (event) => {
    const data = JSON.parse(event.data);
    appendLog('file', 'file', escapeHtml(data.relativePath));
  });

  currentEventSource.addEventListener('file-done', (event) => {
    const data = JSON.parse(event.data);
    filesDoneInJob += 1;
    updateProgress();
    if (!data.ok) {
      appendLog('fail', 'gagal', escapeHtml(`${data.relativePath}: ${data.error}`));
    }
  });

  currentEventSource.addEventListener('line', (event) => {
    const data = JSON.parse(event.data);
    if (data.error) {
      appendLog('fail', 'error', escapeHtml(`${data.source.slice(0, 40)}: ${data.error}`));
      return;
    }
    const source = escapeHtml(data.source.slice(0, 60));
    const result = escapeHtml((data.result || '').slice(0, 60));
    appendLog('translation', 'teks', `${source}<span class="arrow">&rarr;</span>${result}`);
  });

  currentEventSource.addEventListener('done', (event) => {
    const data = JSON.parse(event.data);
    appendLog('ok', 'selesai', `${data.processed} file diproses, ${data.failed} gagal. Hasil: ${escapeHtml(data.outputRoot)}`);
    setRunningUI(false);
    currentEventSource.close();
  });

  currentEventSource.addEventListener('error', () => {
    appendLog('fail', 'koneksi', 'Koneksi log terputus.');
    setRunningUI(false);
  });
}

async function cancelTranslation() {
  if (!currentJobId) return;
  await fetch(`/api/translate/cancel/${currentJobId}`, { method: 'POST' });
  appendLog('fail', 'batal', 'Proses dibatalkan oleh pengguna.');
  setRunningUI(false);
  if (currentEventSource) currentEventSource.close();
}

el.inspectBtn.addEventListener('click', inspectFolder);
el.verifyBtn.addEventListener('click', verifyProvider);
el.startBtn.addEventListener('click', startTranslation);
el.cancelBtn.addEventListener('click', cancelTranslation);
el.providerSelect.addEventListener('change', updateProviderFields);

(async () => {
  await loadProviders();
  await loadDefaultsFromConfig();
  await loadGameFolders();
})();
