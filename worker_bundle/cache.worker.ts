import { CacheWorker } from '../worker/workerCache';

export const worker = new CacheWorker(self, false);
