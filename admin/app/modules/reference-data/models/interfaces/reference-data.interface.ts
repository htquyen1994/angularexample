export interface IReferenceData {
  dataPackageId: string;
  metadata: IReferenceDataMetadata;
  zoomLevelSettings: IZoomLevelSettings;
  tenantsWithAccess: ITenantsWithAccess[];
  datasetNameAliases: IAliasInfo[];
  databaseInfo: IDatabaseInfo;
  layerGroupNames: ILayerGroupInfo[];
  insightInfo: IInsightInfo;
  checked?: boolean;
}

export interface IReferenceDataMetadata {
  datasetAccuracy: string;
  datasetCoverage: string;
  datasetDescription: string;
  datasetName: string;
  datasetShapeType: string;
  datasetNotes: string;
  datasetSource: string;
  datasetProvidedBy: string;
  datasetDataVintage: string;
  datasetLastUpdated: string;
  datasetNextUpdateAvailable: string;
  datasetNextUpdatePlanned: string;
  datasetCopyright: string;
  datasetInDefaultBuild: string;
  datasetPlannedUpdateFrequency: string;
  datasetUpdateType: string;
  datasetUpdateFrequency: string;
  datasetTimeCorePersonHours: string;
  datasetTimeCoreComputeHours: string;


}

export interface IZoomLevelSettings {
  connectionString: string;
  containerName: string;
  maxClusteredZoomLevel: number;
  maxHeatmapZoomLevel: number;
  maxZoomLevel: number;
  minClusteredZoomLevel: number;
  minHeatmapZoomLevel: number;
  minZoomLevel: number;
}

export interface ITenantsWithAccess {
  tenantId: string;
  tenantName: string;
}

export interface IInsightInfo {
  insightable: string;
  matchable: string;
}

export interface IAliasInfo {
  datasetName: string;
}

export interface ILayerGroupInfo {
  layerGroupName: string;
}

export interface IDatabaseInfo {
  viewName: string;
  database: string;
  numColumns: string;
  numRows: string;
}
export interface ReferenceDataFilter {
  term: string;
  selectedTenants: string[];
  selectedLayers: string[];
  defaultBuildOnly: boolean
}


export interface ICacheDelete {
  dataPackageId: string;
  zoomLevel: number[];
  zoomLevel_clustered: number[];
  connectionStringName: string;
}
