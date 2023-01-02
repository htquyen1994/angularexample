import {WORKER_ACTION, WORKER_ACTION_UPDATE_OVERLAY} from './worker-topic.constants';

export interface WorkerMessage {
  action: WORKER_ACTION;
  key?: string;
  data?: any;
  isError?: boolean;
}

export interface IUpdateOverlayRespone {
  type: WORKER_ACTION_UPDATE_OVERLAY,
  data: any
}