const fs = require('fs');
const path = require('path');
const { listEngines, detectEngine, getEngine } = require('./engines/registry');
const { listProviders, createProvider } = require('./providers/registry');
const { TranslationCache } = require('./core/translationCache');
const { TranslationJob } = require('./core/translationJob');
const { GAMES_ROOT, listGameFolders, resolveGamePath, ensureGamesRootExists } = require('./core/gamesRoot');
const { listTranslatedFolders, listRevisableFilesRecursive, resolveTranslatedFile } = require('./core/revisionBrowser');
const { extractTextEntries, applyTextEdits } = require('./core/revisionEditor');

const activeJobs = new Map();

function registerRoutes(app) {
  ensureGamesRootExists();

  app.get('/api/engines', (req, res) => {
    res.json(listEngines());
  });

  app.get('/api/providers', (req, res) => {
    res.json(listProviders());
  });

  app.get('/api/games', (req, res) => {
    res.json({ gamesRoot: GAMES_ROOT, folders: listGameFolders() });
  });

  app.post('/api/project/inspect', (req, res) => {
    const { folderName, languageFolder } = req.body;
    let folderPath;
    try {
      folderPath = resolveGamePath(folderName);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!fs.existsSync(folderPath)) {
      return res.status(400).json({ error: 'Folder tidak ditemukan di dalam games/.' });
    }

    const engine = detectEngine(folderPath);
    if (!engine) {
      return res.status(422).json({ error: 'Tidak ada engine yang cocok dengan folder ini.' });
    }

    const availableLanguages = engine.listAvailableLanguages
      ? engine.listAvailableLanguages(folderPath)
      : [];

    const files = engine.listSourceFiles(folderPath, { languageFolder });
    res.json({
      engineId: engine.id,
      engineLabel: engine.label,
      fileCount: files.length,
      files: files.map((f) => f.relativePath),
      availableLanguages,
      selectedLanguage: languageFolder || availableLanguages[0] || null
    });
  });

  app.post('/api/provider/verify', async (req, res) => {
    const { providerId, config } = req.body;
    try {
      const provider = createProvider(providerId, config || {});
      await provider.verify();
      res.json({ ok: true });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post('/api/provider/usage', async (req, res) => {
    const { providerId, config } = req.body;
    try {
      const provider = createProvider(providerId, config || {});
      const usage = await provider.checkUsage();
      res.json({ ok: true, usage });
    } catch (error) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post('/api/translate/start', (req, res) => {
    const {
      folderName,
      engineId,
      providerId,
      providerConfig,
      sourceLang,
      targetLang,
      relayThroughEnglish,
      maxCharsPerLine,
      languageFolder
    } = req.body;

    let folderPath;
    try {
      folderPath = resolveGamePath(folderName);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!fs.existsSync(folderPath)) {
      return res.status(400).json({ error: 'Folder tidak ditemukan di dalam games/.' });
    }

    let engine;
    try {
      engine = getEngine(engineId);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    let provider;
    try {
      provider = createProvider(providerId, providerConfig || {});
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const outputRoot = `${folderPath}_indo`;
    const finalOutputRoot = fs.existsSync(outputRoot) ? `${outputRoot}_${Date.now()}` : outputRoot;
    fs.mkdirSync(finalOutputRoot, { recursive: true });

    const cacheDir = path.join(GAMES_ROOT, '..', '.cache');
    const cacheFile = path.join(cacheDir, `${engineId}_${sourceLang}_${providerId}.json`);
    const cache = new TranslationCache(cacheFile);

    const job = new TranslationJob({
      engine,
      projectRoot: folderPath,
      outputRoot: finalOutputRoot,
      provider,
      sourceLang,
      targetLang: targetLang || 'ID',
      relayThroughEnglish: Boolean(relayThroughEnglish),
      maxCharsPerLine: maxCharsPerLine || 74,
      languageFolder,
      cache
    });

    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeJobs.set(jobId, job);

    res.json({
      jobId,
      outputRoot: path.relative(GAMES_ROOT, finalOutputRoot),
      cacheEntriesLoaded: cache.size
    });
  });

  app.get('/api/translate/stream/:jobId', (req, res) => {
    const job = activeJobs.get(req.params.jobId);
    if (!job) {
      return res.status(404).end();
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const send = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    job.on('start', (data) => send('start', data));
    job.on('file-start', (data) => send('file-start', data));
    job.on('file-done', (data) => send('file-done', data));
    job.on('line', (data) => send('line', data));
    job.on('done', (data) => {
      send('done', data);
      res.end();
      activeJobs.delete(req.params.jobId);
    });

    req.on('close', () => {
      job.cancel();
    });

    job.run().catch((error) => {
      send('error', { message: error.message });
      res.end();
      activeJobs.delete(req.params.jobId);
    });
  });

  app.post('/api/translate/cancel/:jobId', (req, res) => {
    const job = activeJobs.get(req.params.jobId);
    if (job) job.cancel();
    res.json({ ok: true });
  });

  // --- Manual Revisi ---

  app.get('/api/revision/folders', (req, res) => {
    res.json({ folders: listTranslatedFolders() });
  });

  app.get('/api/revision/files', (req, res) => {
    const { folderName } = req.query;
    if (!folderName) return res.status(400).json({ error: 'folderName wajib diisi.' });

    let folderPath;
    try {
      folderPath = resolveGamePath(folderName);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ error: 'Folder tidak ditemukan.' });
    }

    res.json({ files: listRevisableFilesRecursive(folderPath) });
  });

  app.get('/api/revision/entries', (req, res) => {
    const { folderName, filePath } = req.query;
    if (!folderName || !filePath) {
      return res.status(400).json({ error: 'folderName dan filePath wajib diisi.' });
    }

    let resolvedPath;
    try {
      resolvedPath = resolveTranslatedFile(folderName, filePath);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File tidak ditemukan.' });
    }

    try {
      const entries = extractTextEntries(resolvedPath);
      res.json({ entries });
    } catch (error) {
      res.status(500).json({ error: `Gagal membaca file: ${error.message}` });
    }
  });

  app.post('/api/revision/save', (req, res) => {
    const { folderName, filePath, edits } = req.body;
    if (!folderName || !filePath || !Array.isArray(edits)) {
      return res.status(400).json({ error: 'folderName, filePath, dan edits wajib diisi.' });
    }

    let resolvedPath;
    try {
      resolvedPath = resolveTranslatedFile(folderName, filePath);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File tidak ditemukan.' });
    }

    try {
      const appliedCount = applyTextEdits(resolvedPath, edits);
      res.json({ ok: true, appliedCount });
    } catch (error) {
      res.status(500).json({ error: `Gagal menyimpan perubahan: ${error.message}` });
    }
  });
}

module.exports = { registerRoutes };
