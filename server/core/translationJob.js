const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { translateString } = require('./translateString');

const CACHE_SAVE_INTERVAL = 40;

class TranslationJob extends EventEmitter {
  constructor({ engine, projectRoot, outputRoot, provider, sourceLang, targetLang, relayThroughEnglish, maxCharsPerLine, cache }) {
    super();
    this.engine = engine;
    this.projectRoot = projectRoot;
    this.outputRoot = outputRoot;
    this.provider = provider;
    this.sourceLang = sourceLang;
    this.targetLang = targetLang;
    this.relayThroughEnglish = relayThroughEnglish;
    this.maxCharsPerLine = maxCharsPerLine;
    this.cache = cache;
    this.cancelled = false;
    this.translatedCount = 0;
  }

  cancel() {
    this.cancelled = true;
  }

  async run() {
    const files = this.engine.listSourceFiles(this.projectRoot);
    this.emit('start', { totalFiles: files.length });

    let processed = 0;
    let failed = 0;

    const translateOne = async (text) => {
      if (this.cancelled) return text;
      return translateString({
        text,
        provider: this.provider,
        sourceLang: this.sourceLang,
        targetLang: this.targetLang,
        cache: this.cache,
        relayThroughEnglish: this.relayThroughEnglish,
        onLog: (source, result, error) => {
          this.translatedCount += 1;
          if (this.translatedCount % CACHE_SAVE_INTERVAL === 0) this.cache.save();
          this.emit('line', { source, result, error: error ? error.message : null });
        }
      });
    };

    for (const file of files) {
      if (this.cancelled) break;

      this.emit('file-start', { relativePath: file.relativePath });
      try {
        const output = await this.engine.translateFile(file, translateOne, {
          maxCharsPerLine: this.maxCharsPerLine,
          joinWithoutSpace: this.sourceLang === 'JA'
        });

        const destination = path.join(this.outputRoot, file.relativePath);
        fs.mkdirSync(path.dirname(destination), { recursive: true });
        fs.writeFileSync(destination, output, 'utf8');

        processed += 1;
        this.emit('file-done', { relativePath: file.relativePath, ok: true });
      } catch (error) {
        failed += 1;
        this.emit('file-done', { relativePath: file.relativePath, ok: false, error: error.message });
      }
    }

    this.cache.save();
    this.emit('done', {
      processed,
      failed,
      cancelled: this.cancelled,
      outputRoot: this.outputRoot
    });
  }
}

module.exports = { TranslationJob };
          
