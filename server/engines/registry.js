const rpgMakerEngine = require('./rpgmaker');
const renpyEngine = require('./renpy');

const ENGINES = [rpgMakerEngine, renpyEngine];

function listEngines() {
  return ENGINES.map((engine) => ({ id: engine.id, label: engine.label }));
}

function detectEngine(projectRoot) {
  return ENGINES.find((engine) => engine.detect(projectRoot)) || null;
}

function getEngine(id) {
  const engine = ENGINES.find((entry) => entry.id === id);
  if (!engine) throw new Error(`Unknown engine: ${id}`);
  return engine;
}

module.exports = { listEngines, detectEngine, getEngine };
