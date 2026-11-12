import fs from 'node:fs';
import path from 'node:path';

// Reads the cleaned snapshots written by pipeline/ingest.py. Read on every
// request so re-running the pipeline refreshes the site without a rebuild.
const read = (...parts) => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', ...parts), 'utf8'));

export const getCapacity = () => read('clean', 'capacity.json');
export const getGeneration = () => read('clean', 'generation.json');
export const getProvenance = () => read('clean', 'provenance.json');
export const getValidation = () => read('clean', 'validation.json');
export const getJobs = () => read('jobs.json');
