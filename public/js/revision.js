const RevisionPage = (() => {
  const el = {};
  let currentEntries = [];
  let dirtyIds = new Set();
  let currentFolder = null;
  let currentFile = null;

  function cacheElements() {
    el.folderSelect = document.getElementById('revisionFolderSelect');
    el.fileSelect = document.getElementById('revisionFileSelect');
    el.status = document.getElementById('revisionStatus');
    el.filter = document.getElementById('revisionFilter');
    el.saveBtn = document.getElementById('revisionSaveBtn');
    el.list = document.getElementById('revisionList');
  }

  function escapeHtml(text) {
    return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  async function loadFolders() {
    const response = await fetch('/api/revision/folders');
    const payload = await response.json();

    if (payload.folders.length === 0) {
      el.folderSelect.innerHTML = '<option value="">(belum ada hasil terjemahan)</option>';
      el.fileSelect.disabled = true;
      return;
    }

    el.folderSelect.innerHTML = payload.folders
      .map((name) => `<option value="${name}">${name}</option>`)
      .join('');
    await loadFilesForSelectedFolder();
  }

  async function loadFilesForSelectedFolder() {
    currentFolder = el.folderSelect.value;
    if (!currentFolder) return;

    const response = await fetch(`/api/revision/files?folderName=${encodeURIComponent(currentFolder)}`);
    const payload = await response.json();

    if (!response.ok) {
      el.status.textContent = payload.error || 'Gagal membaca folder.';
      return;
    }

    if (payload.files.length === 0) {
      el.fileSelect.innerHTML = '<option value="">(tidak ada file JSON)</option>';
      el.fileSelect.disabled = true;
      return;
    }

    el.fileSelect.innerHTML = payload.files
      .map((f) => `<option value="${f}">${f}</option>`)
      .join('');
    el.fileSelect.disabled = false;
    await loadEntriesForSelectedFile();
  }

  async function loadEntriesForSelectedFile() {
    currentFile = el.fileSelect.value;
    if (!currentFile) return;

    el.status.textContent = 'Memuat teks...';
    dirtyIds = new Set();
    el.saveBtn.disabled = true;

    const params = new URLSearchParams({ folderName: currentFolder, filePath: currentFile });
    const response = await fetch(`/api/revision/entries?${params}`);
    const payload = await response.json();

    if (!response.ok) {
      el.status.textContent = payload.error || 'Gagal membaca file.';
      el.list.innerHTML = '';
      return;
    }

    currentEntries = payload.entries;
    el.status.textContent = `${currentEntries.length} baris teks ditemukan.`;
    renderList();
  }

  function renderList() {
    const filterText = el.filter.value.trim().toLowerCase();
    const visibleEntries = filterText
      ? currentEntries.filter((e) => e.text.toLowerCase().includes(filterText))
      : currentEntries;

    if (visibleEntries.length === 0) {
      el.list.innerHTML = '<p class="log-empty">Tidak ada baris yang cocok.</p>';
      return;
    }

    el.list.innerHTML = visibleEntries.map((entry) => `
      <div class="revision-row" data-id="${escapeHtml(entry.id)}">
        <div class="revision-row-path">${escapeHtml(entry.id)}</div>
        <textarea class="revision-row-input" data-id="${escapeHtml(entry.id)}" rows="1">${escapeHtml(entry.text)}</textarea>
      </div>
    `).join('');

    el.list.querySelectorAll('.revision-row-input').forEach((textarea) => {
      textarea.addEventListener('input', () => {
        const id = textarea.dataset.id;
        const entry = currentEntries.find((e) => e.id === id);
        if (entry) entry.text = textarea.value;
        dirtyIds.add(id);
        el.saveBtn.disabled = dirtyIds.size === 0;
        autoGrow(textarea);
      });
      autoGrow(textarea);
    });
  }

  function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  async function saveChanges() {
    if (dirtyIds.size === 0) return;

    const edits = currentEntries
      .filter((e) => dirtyIds.has(e.id))
      .map((e) => ({ id: e.id, text: e.text }));

    el.status.textContent = 'Menyimpan...';
    el.saveBtn.disabled = true;

    try {
      const response = await fetch('/api/revision/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: currentFolder, filePath: currentFile, edits })
      });
      const payload = await response.json();

      if (!response.ok) {
        el.status.textContent = payload.error || 'Gagal menyimpan.';
        el.saveBtn.disabled = false;
        return;
      }

      el.status.textContent = `Tersimpan — ${payload.appliedCount} baris diperbarui.`;
      dirtyIds = new Set();
    } catch (error) {
      el.status.textContent = `Gagal: ${error.message}`;
      el.saveBtn.disabled = false;
    }
  }

  function bindEvents() {
    el.folderSelect.addEventListener('change', loadFilesForSelectedFolder);
    el.fileSelect.addEventListener('change', loadEntriesForSelectedFile);
    el.filter.addEventListener('input', renderList);
    el.saveBtn.addEventListener('click', saveChanges);
  }

  async function init() {
    cacheElements();
    bindEvents();
  }

  function onActivate() {
    loadFolders();
  }

  return { init, onActivate };
})();
