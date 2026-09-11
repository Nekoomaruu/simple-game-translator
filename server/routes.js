const fs = require('fs');
const path = require('path');
const { listEngines, detectEngine, getEngine } = require('./engines/registry');
const { listProviders, createProvider } = require('./providers/registry');
const { TranslationCache } = require('./core/translationCache');
const { TranslationJob } = require('./core/translationJob');

const activeJobs = new Map();

function registerRoutes(app) {
  app.get('/api/engines', (req, res) => {
    res.json(listEngines());
  });

  app.get('/api/providers', (req, res) => {
    res.json(listProviders());
  });

  app.post('/api/project/inspect', (req, res) => {
    const { folderPath } = req.body;
    if (!folderPath || !fs.existsSync(folderPath)) {
      return res.status(400).json({ error: 'Folder tidak ditemukan.' });
    }

    const engine = detectEngine(folderPath);
    if (!engine) {
      return res.status(422).json({ error: 'Tidak ada engine yang cocok dengan folder ini.' });
    }

    const files = engine.listSourceFiles(folderPath);
    res.json({
      engineId: engine.id,
      engineLabel: engine.label,
      fileCount: files.length,
      files: files.map((f) => f.relativePath)
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

  app.post('/api/translate/start', (req, res) => {
    const {
      folderPath,
      engineId,
      providerId,
      providerConfig,
      sourceLang,
      targetLang,
      relayThroughEnglish,
      maxCharsPerLine
    } = req.body;

    if (!folderPath || !fs.existsSync(folderPath)) {
      return res.status(400).json({ error: 'Folder tidak ditemukan.' });
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

    const cacheDir = path.join(process.cwd(), '.cache');
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
      cache
    });

    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    activeJobs.set(jobId, job);

    res.json({ jobId, outputRoot: finalOutputRoot, cacheEntriesLoaded: cache.size });
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
}

module.exports = { registerRoutes };
      
