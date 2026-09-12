const TranslatePage = (() => {
  const el = {};
  let state = { engineId: null };
  let currentJobId = null;
  let currentEventSource = null;
  let totalFilesInJob = 0;
  let filesDoneInJob = 0;

  function cacheElements() {
    el.folderSelect = document.getElementById('folderSelect');
    el.inspectBtn = document.getElementById('inspectBtn');
    el.inspectResult = document.getElementById('inspectResult');
    el.engineLabel = document.getElementById('engineLabel');
    el.languageFolderGroup = document.getElementById('languageFolderGroup');
    el.languageFolderSelect = document.getElementById('languageFolderSelect');
    el.translateProviderPill = document.getElementById('translateProviderPill');
    el.startBtn = document.getElementById('startBtn');
    el.cancelBtn = document.getElementById('cancelBtn');
    el.progressLabel = document.getElementById('progressLabel');
    el.progressFill = document.getElementById('progressFill');
    el.logStream = document.getElementById('logStream');
  }

  function escapeHtml(text) {
    return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

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

  function refreshProviderPill() {
    const settings = Storage.loadSettings();
    const info = Dashboard.providersInfo.find((p) => p.id === settings.providerId);
    el.translateProviderPill.textContent = info ? info.label : settings.providerId;
    el.translateProviderPill.classList.toggle('pill-active', Boolean(info));
  }

  async function inspectFolder(preferredLanguageFolder) {
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
        body: JSON.stringify({ folderName, languageFolder: preferredLanguageFolder || undefined })
      });
      const payload = await response.json();

      if (!response.ok) {
        el.inspectResult.textContent = payload.error || 'Gagal membaca folder.';
        el.languageFolderGroup.hidden = true;
        return;
      }

      state.engineId = payload.engineId;
      el.engineLabel.textContent = payload.engineLabel;
      el.engineLabel.classList.add('pill-active');
      el.inspectResult.textContent = `${payload.fileCount} file terdeteksi untuk diterjemahkan.`;
      el.startBtn.disabled = false;

      if (payload.availableLanguages && payload.availableLanguages.length > 1) {
        el.languageFolderGroup.hidden = false;
        el.languageFolderSelect.innerHTML = payload.availableLanguages
          .map((name) => `<option value="${name}">${name}</option>`)
          .join('');
        el.languageFolderSelect.value = payload.selectedLanguage;
      } else {
        el.languageFolderGroup.hidden = true;
      }
    } catch (error) {
      el.inspectResult.textContent = `Gagal: ${error.message}`;
    }
  }

  function setRunningUI(isRunning) {
    el.startBtn.hidden = isRunning;
    el.cancelBtn.hidden = !isRunning;
    el.inspectBtn.disabled = isRunning;
    el.folderSelect.disabled = isRunning;
    el.languageFolderSelect.disabled = isRunning;
  }

  function updateProgress() {
    const percent = totalFilesInJob === 0 ? 0 : Math.round((filesDoneInJob / totalFilesInJob) * 100);
    el.progressFill.style.width = `${percent}%`;
    el.progressLabel.textContent = `${filesDoneInJob} / ${totalFilesInJob} file — ${percent}%`;
  }

  async function startTranslation() {
    if (!state.engineId) return;

    const settings = Storage.loadSettings();
    const providerConfig = Storage.currentProviderConfig(settings);

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
        providerId: settings.providerId,
        providerConfig,
        sourceLang: settings.sourceLang,
        targetLang: 'ID',
        relayThroughEnglish: settings.sourceLang === 'JA',
        maxCharsPerLine: settings.maxCharsPerLine,
        languageFolder: el.languageFolderGroup.hidden ? undefined : el.languageFolderSelect.value
      })
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
      if (data.totalTokensUsed) Dashboard.addSessionTokens(data.totalTokensUsed);
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

  function bindEvents() {
    el.inspectBtn.addEventListener('click', () => inspectFolder());
    el.languageFolderSelect.addEventListener('change', () => inspectFolder(el.languageFolderSelect.value));
    el.startBtn.addEventListener('click', startTranslation);
    el.cancelBtn.addEventListener('click', cancelTranslation);
  }

  async function init() {
    cacheElements();
    bindEvents();
    await loadGameFolders();
  }

  function onActivate() {
    refreshProviderPill();
  }

  return { init, onActivate };
})();
