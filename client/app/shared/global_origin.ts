export const API_BASE_HREF = `${location.pathname}/`;
export const MAX_NUMBER_WORKERS = 4;
export const MAX_NUMBER_WORKERS_HANDLING = 2;
export const NAME_OF_WORKER_HANDLING = "workerHandling_";
export const NAME_OF_WORKER_HANDLING_CHILD = "workerHandling_child_";
export const TERMINATE_WORKER_TIMEOUT = 120000; //120s
export const TERMINATE_WORKER_TIMEOUT_CHILD = 100000;
export enum INVALIDCACHETYPE {
    Tiles = 'Tiles',
    FeatureIds = 'FeatureIds',
    Prefixes = 'Prefixes',
    All = 'All'
}
export function pagingShapes(_shapes: any[], papeSize = 500) {
  const shapes = Object.assign([], _shapes);
  const array = [];
  if (shapes.length > 1000) {
    while (shapes.length) {
      array.push(shapes.splice(0, papeSize));
    }
  } else {
    array.push(shapes.splice(0))
  }
  return array;
}
