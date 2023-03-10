export enum WORKER_ACTION {
  GET = 'GET',
  TERMINATEREQUEST = 'TERMINATEREQUEST',
  UPDATEOVERLAY = 'UPDATEOVERLAY',
  DELETEOVERLAY = 'DELETEOVERLAY',
  PROGRESSLOADING =  'PROGRESSLOADING',
  INVALIDATEANDUPDATE = 'INVALIDATEANDUPDATE',
  CHECKRUNNING = 'CHECKRUNNING',
  ERROR_UNAUTHORIZED = 'ERROR_UNAUTHORIZED'
}

export enum WORKER_ACTION_UPDATE_OVERLAY{
  localFeatures = 'localFeatures',
  tileDONE = 'tileDONE',
  localFeaturesLength = 'localFeaturesLength',
  PROGRESS = 'PROGRESS',
  UNSUBCRIBE ='UNSUBCRIBE',
}

export enum INVALIDCACHETYPE{
  Tiles = 'Tiles',
  FeatureIds = 'FeatureIds',
  Prefixes = 'Prefixes',
  All = 'All'
}