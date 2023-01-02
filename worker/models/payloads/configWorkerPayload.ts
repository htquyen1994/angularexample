import { Payload } from './Payload';

export class ConfigWorkerPayload extends Payload {
  max_number_workers = 4;
  max_number_workers_handling = 2;
  constructor(max_number_workers: number = 4, max_number_workers_handling: number = 2) {
    super();
    this.max_number_workers = max_number_workers;
    this.max_number_workers_handling = max_number_workers_handling;
  }
}
