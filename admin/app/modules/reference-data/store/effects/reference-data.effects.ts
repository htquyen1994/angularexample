import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, concatMap, switchMap, takeUntil, combineLatest, withLatestFrom } from 'rxjs/operators';
import { uniq, filter } from 'lodash';
import { EMPTY, of } from 'rxjs';
import { ReferenceDataActions } from '../actions';
import { ReferenceDataService, ReferenceDataStoreService } from '../../services';
import { environment } from 'src/admin/environments/environment';
import { ArrayUtils } from '@periscope-lib/commons/utils/array.utils';
import { ITenantsWithAccess, IReferenceData, ReferenceDataFilter } from '../../models';
import { ISort } from '@admin-shared/models/common-table';



@Injectable()
export class ReferenceDataEffects {

  // private testData = [
  //   { "dataPackageId": "3095ad3e-d73f-48a0-b03e-7c01ec37d4ff", "metadata": { "$type": "Newgrove.Periscope.Data.Packaging.Metadata.DataPackageMetadata, Newgrove.Periscope.Data.Packaging, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", "datasetName": "Cars", "datasetAccuracy": "Unknown", "datasetCoverage": "UK", "datasetDescription": "Responses to UK Census 2011 - Cars Ownership", "datasetShapeType": "Polygon", "datasetSource": "Office for National Statistics", "datasetLastUpdated": "2017-01-01T00:00:00", "datasetNextUpdateAvailable": "2021-01-01T00:00:00", "datasetNextUpdatePlanned": "2021-01-01T00:00:00", "datasetDataVintage": "2011", "datasetInDefaultBuild": true, "datasetCopyright": "", "datasetNotes": "" }, "datasetNameAliases": [{ "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }], "layerGroupNames": [{ "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }], "zoomLevelSettings": { "maxHeatmapZoomLevel": null, "minHeatmapZoomLevel": null, "connectionString": "SharedResourcesV1ConnectionString", "containerName": null, "maxZoomLevel": 19, "minZoomLevel": 13, "maxClusteredZoomLevel": 12, "minClusteredZoomLevel": 6 }, "tenantsWithAccess": [{ "tenantId": "f90da5b5-ecae-46d0-95c5-42ef327b652f", "tenantName": "Newgrove" }, { "tenantId": "8982ed18-1e32-487f-884e-93583c29c61c", "tenantName": "Paddy Power Betfair" }, { "tenantId": "c9e63704-2c59-4122-8b69-3f7e49bd1e4b", "tenantName": "Well" }, { "tenantId": "5e5b8f35-00cc-4484-a391-15b65717a73a", "tenantName": "Anytime Fitness (UK)" }, { "tenantId": "8d164e0e-aac5-4f0a-99a7-e7a39c0fffa0", "tenantName": "ReferenceData" }, { "tenantId": "d0e406b3-4f54-42f2-8300-3d79d41aa69c", "tenantName": "CeX" }, { "tenantId": "3a6d5a05-6816-4c3a-9902-689ade24c6e5", "tenantName": "LifestyleFitness" }, { "tenantId": "97cdb218-3d6a-43ad-8070-c3026452fdb6", "tenantName": "The Little Gym" }, { "tenantId": "2dcfca1a-c1dc-47b9-9d6f-671a7d3e597c", "tenantName": "CinemaNext" }, { "tenantId": "dd306d38-9629-432c-a7d3-aed4d6c3e232", "tenantName": "LawnTennisAssociation" }, { "tenantId": "c44f57d1-5494-4fc7-bd2a-dfb5c9932e4e", "tenantName": "BoyleSports" }, { "tenantId": "c8d8c240-2c9a-4c26-990c-c2d31c592c4e", "tenantName": "RoyalCaribbean" }, { "tenantId": "d1568fcd-0bf8-4714-ad15-91c9cc451181", "tenantName": "Curzon" }, { "tenantId": "df3bd44f-6d76-4b59-8fa0-2de7b190544d", "tenantName": "Fennies" }, { "tenantId": "ded44f29-0385-4125-a97c-9a7a96e15b4d", "tenantName": "Praesepe" }, { "tenantId": "aabb1777-fdb7-4a69-bdf4-36db913e6baf", "tenantName": "Serendipity2" }, { "tenantId": "dd35a26b-b581-4979-a3c5-9b9b79f486d1", "tenantName": "PostOffice" }], "databaseInfo": { "viewName": "vwCensus11_UK_Cars", "database": "PeriscopeReferenceDataLive", "numColumns": 34, "numRows": 232296 }, "insightInfo": { "insightable": true, "matchable": true } }
  //   , { "dataPackageId": "3095ad3e-d73f-48a0-b03e-7c01ec37d4fa", "metadata": { "$type": "Newgrove.Periscope.Data.Packaging.Metadata.DataPackageMetadata, Newgrove.Periscope.Data.Packaging, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", "datasetName": "Cars", "datasetAccuracy": "Unknown", "datasetCoverage": "UK", "datasetDescription": "Responses to UK Census 2011 - Cars Ownership", "datasetShapeType": "Polygon", "datasetSource": "Office for National Statistics", "datasetLastUpdated": "2017-01-01T00:00:00", "datasetNextUpdateAvailable": "2021-01-01T00:00:00", "datasetNextUpdatePlanned": "2021-01-01T00:00:00", "datasetDataVintage": "2011", "datasetInDefaultBuild": true, "datasetCopyright": "", "datasetNotes": "" }, "datasetNameAliases": [{ "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }], "layerGroupNames": [{ "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }], "zoomLevelSettings": { "maxHeatmapZoomLevel": null, "minHeatmapZoomLevel": null, "connectionString": "SharedResourcesV1ConnectionString", "containerName": null, "maxZoomLevel": 19, "minZoomLevel": 13, "maxClusteredZoomLevel": 12, "minClusteredZoomLevel": 6 }, "tenantsWithAccess": [{ "tenantId": "f90da5b5-ecae-46d0-95c5-42ef327b652f", "tenantName": "Newgrove" }, { "tenantId": "8982ed18-1e32-487f-884e-93583c29c61c", "tenantName": "Paddy Power Betfair" }, { "tenantId": "c9e63704-2c59-4122-8b69-3f7e49bd1e4b", "tenantName": "Well" }, { "tenantId": "5e5b8f35-00cc-4484-a391-15b65717a73a", "tenantName": "Anytime Fitness (UK)" }, { "tenantId": "8d164e0e-aac5-4f0a-99a7-e7a39c0fffa0", "tenantName": "ReferenceData" }, { "tenantId": "d0e406b3-4f54-42f2-8300-3d79d41aa69c", "tenantName": "CeX" }, { "tenantId": "3a6d5a05-6816-4c3a-9902-689ade24c6e5", "tenantName": "LifestyleFitness" }, { "tenantId": "97cdb218-3d6a-43ad-8070-c3026452fdb6", "tenantName": "The Little Gym" }, { "tenantId": "2dcfca1a-c1dc-47b9-9d6f-671a7d3e597c", "tenantName": "CinemaNext" }, { "tenantId": "dd306d38-9629-432c-a7d3-aed4d6c3e232", "tenantName": "LawnTennisAssociation" }, { "tenantId": "c44f57d1-5494-4fc7-bd2a-dfb5c9932e4e", "tenantName": "BoyleSports" }, { "tenantId": "c8d8c240-2c9a-4c26-990c-c2d31c592c4e", "tenantName": "RoyalCaribbean" }, { "tenantId": "d1568fcd-0bf8-4714-ad15-91c9cc451181", "tenantName": "Curzon" }, { "tenantId": "df3bd44f-6d76-4b59-8fa0-2de7b190544d", "tenantName": "Fennies" }, { "tenantId": "ded44f29-0385-4125-a97c-9a7a96e15b4d", "tenantName": "Praesepe" }, { "tenantId": "aabb1777-fdb7-4a69-bdf4-36db913e6baf", "tenantName": "Serendipity2" }, { "tenantId": "dd35a26b-b581-4979-a3c5-9b9b79f486d1", "tenantName": "PostOffice" }], "databaseInfo": { "viewName": "vwCensus11_UK_Cars", "database": "PeriscopeReferenceDataLive", "numColumns": 34, "numRows": 232296 }, "insightInfo": { "insightable": true, "matchable": true } }
  //   , { "dataPackageId": "3095ad3e-d73f-48a0-b03e-7c01ec37d4fb", "metadata": { "$type": "Newgrove.Periscope.Data.Packaging.Metadata.DataPackageMetadata, Newgrove.Periscope.Data.Packaging, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", "datasetName": "Cars", "datasetAccuracy": "Unknown", "datasetCoverage": "UK", "datasetDescription": "Responses to UK Census 2011 - Cars Ownership", "datasetShapeType": "Polygon", "datasetSource": "Office for National Statistics", "datasetLastUpdated": "2017-01-01T00:00:00", "datasetNextUpdateAvailable": "2021-01-01T00:00:00", "datasetNextUpdatePlanned": "2021-01-01T00:00:00", "datasetDataVintage": "2011", "datasetInDefaultBuild": true, "datasetCopyright": "", "datasetNotes": "" }, "datasetNameAliases": [{ "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }], "layerGroupNames": [{ "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }], "zoomLevelSettings": { "maxHeatmapZoomLevel": null, "minHeatmapZoomLevel": null, "connectionString": "SharedResourcesV1ConnectionString", "containerName": null, "maxZoomLevel": 19, "minZoomLevel": 13, "maxClusteredZoomLevel": 12, "minClusteredZoomLevel": 6 }, "tenantsWithAccess": [{ "tenantId": "f90da5b5-ecae-46d0-95c5-42ef327b652f", "tenantName": "Newgrove" }, { "tenantId": "8982ed18-1e32-487f-884e-93583c29c61c", "tenantName": "Paddy Power Betfair" }, { "tenantId": "c9e63704-2c59-4122-8b69-3f7e49bd1e4b", "tenantName": "Well" }, { "tenantId": "5e5b8f35-00cc-4484-a391-15b65717a73a", "tenantName": "Anytime Fitness (UK)" }, { "tenantId": "8d164e0e-aac5-4f0a-99a7-e7a39c0fffa0", "tenantName": "ReferenceData" }, { "tenantId": "d0e406b3-4f54-42f2-8300-3d79d41aa69c", "tenantName": "CeX" }, { "tenantId": "3a6d5a05-6816-4c3a-9902-689ade24c6e5", "tenantName": "LifestyleFitness" }, { "tenantId": "97cdb218-3d6a-43ad-8070-c3026452fdb6", "tenantName": "The Little Gym" }, { "tenantId": "2dcfca1a-c1dc-47b9-9d6f-671a7d3e597c", "tenantName": "CinemaNext" }, { "tenantId": "dd306d38-9629-432c-a7d3-aed4d6c3e232", "tenantName": "LawnTennisAssociation" }, { "tenantId": "c44f57d1-5494-4fc7-bd2a-dfb5c9932e4e", "tenantName": "BoyleSports" }, { "tenantId": "c8d8c240-2c9a-4c26-990c-c2d31c592c4e", "tenantName": "RoyalCaribbean" }, { "tenantId": "d1568fcd-0bf8-4714-ad15-91c9cc451181", "tenantName": "Curzon" }, { "tenantId": "df3bd44f-6d76-4b59-8fa0-2de7b190544d", "tenantName": "Fennies" }, { "tenantId": "ded44f29-0385-4125-a97c-9a7a96e15b4d", "tenantName": "Praesepe" }, { "tenantId": "aabb1777-fdb7-4a69-bdf4-36db913e6baf", "tenantName": "Serendipity2" }, { "tenantId": "dd35a26b-b581-4979-a3c5-9b9b79f486d1", "tenantName": "PostOffice" }], "databaseInfo": { "viewName": "vwCensus11_UK_Cars", "database": "PeriscopeReferenceDataLive", "numColumns": 34, "numRows": 232296 }, "insightInfo": { "insightable": true, "matchable": true } }
  //   , { "dataPackageId": "3095ad3e-d73f-48a0-b03e-7c01ec37d4fc", "metadata": { "$type": "Newgrove.Periscope.Data.Packaging.Metadata.DataPackageMetadata, Newgrove.Periscope.Data.Packaging, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", "datasetName": "Cars", "datasetAccuracy": "Unknown", "datasetCoverage": "UK", "datasetDescription": "Responses to UK Census 2011 - Cars Ownership", "datasetShapeType": "Polygon", "datasetSource": "Office for National Statistics", "datasetLastUpdated": "2017-01-01T00:00:00", "datasetNextUpdateAvailable": "2021-01-01T00:00:00", "datasetNextUpdatePlanned": "2021-01-01T00:00:00", "datasetDataVintage": "2011", "datasetInDefaultBuild": true, "datasetCopyright": "", "datasetNotes": "" }, "datasetNameAliases": [{ "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }], "layerGroupNames": [{ "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }], "zoomLevelSettings": { "maxHeatmapZoomLevel": null, "minHeatmapZoomLevel": null, "connectionString": "SharedResourcesV1ConnectionString", "containerName": null, "maxZoomLevel": 19, "minZoomLevel": 13, "maxClusteredZoomLevel": 12, "minClusteredZoomLevel": 6 }, "tenantsWithAccess": [{ "tenantId": "f90da5b5-ecae-46d0-95c5-42ef327b652f", "tenantName": "Newgrove" }, { "tenantId": "8982ed18-1e32-487f-884e-93583c29c61c", "tenantName": "Paddy Power Betfair" }, { "tenantId": "c9e63704-2c59-4122-8b69-3f7e49bd1e4b", "tenantName": "Well" }, { "tenantId": "5e5b8f35-00cc-4484-a391-15b65717a73a", "tenantName": "Anytime Fitness (UK)" }, { "tenantId": "8d164e0e-aac5-4f0a-99a7-e7a39c0fffa0", "tenantName": "ReferenceData" }, { "tenantId": "d0e406b3-4f54-42f2-8300-3d79d41aa69c", "tenantName": "CeX" }, { "tenantId": "3a6d5a05-6816-4c3a-9902-689ade24c6e5", "tenantName": "LifestyleFitness" }, { "tenantId": "97cdb218-3d6a-43ad-8070-c3026452fdb6", "tenantName": "The Little Gym" }, { "tenantId": "2dcfca1a-c1dc-47b9-9d6f-671a7d3e597c", "tenantName": "CinemaNext" }, { "tenantId": "dd306d38-9629-432c-a7d3-aed4d6c3e232", "tenantName": "LawnTennisAssociation" }, { "tenantId": "c44f57d1-5494-4fc7-bd2a-dfb5c9932e4e", "tenantName": "BoyleSports" }, { "tenantId": "c8d8c240-2c9a-4c26-990c-c2d31c592c4e", "tenantName": "RoyalCaribbean" }, { "tenantId": "d1568fcd-0bf8-4714-ad15-91c9cc451181", "tenantName": "Curzon" }, { "tenantId": "df3bd44f-6d76-4b59-8fa0-2de7b190544d", "tenantName": "Fennies" }, { "tenantId": "ded44f29-0385-4125-a97c-9a7a96e15b4d", "tenantName": "Praesepe" }, { "tenantId": "aabb1777-fdb7-4a69-bdf4-36db913e6baf", "tenantName": "Serendipity2" }, { "tenantId": "dd35a26b-b581-4979-a3c5-9b9b79f486d1", "tenantName": "PostOffice" }], "databaseInfo": { "viewName": "vwCensus11_UK_Cars", "database": "PeriscopeReferenceDataLive", "numColumns": 34, "numRows": 232296 }, "insightInfo": { "insightable": true, "matchable": true } }
  //   , { "dataPackageId": "3095ad3e-d73f-48a0-b03e-7c01ec37d4fd", "metadata": { "$type": "Newgrove.Periscope.Data.Packaging.Metadata.DataPackageMetadata, Newgrove.Periscope.Data.Packaging, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", "datasetName": "Cars", "datasetAccuracy": "Unknown", "datasetCoverage": "UK", "datasetDescription": "Responses to UK Census 2011 - Cars Ownership", "datasetShapeType": "Polygon", "datasetSource": "Office for National Statistics", "datasetLastUpdated": "2017-01-01T00:00:00", "datasetNextUpdateAvailable": "2021-01-01T00:00:00", "datasetNextUpdatePlanned": "2021-01-01T00:00:00", "datasetDataVintage": "2011", "datasetInDefaultBuild": true, "datasetCopyright": "", "datasetNotes": "" }, "datasetNameAliases": [{ "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }], "layerGroupNames": [{ "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }], "zoomLevelSettings": { "maxHeatmapZoomLevel": null, "minHeatmapZoomLevel": null, "connectionString": "SharedResourcesV1ConnectionString", "containerName": null, "maxZoomLevel": 19, "minZoomLevel": 13, "maxClusteredZoomLevel": 12, "minClusteredZoomLevel": 6 }, "tenantsWithAccess": [{ "tenantId": "f90da5b5-ecae-46d0-95c5-42ef327b652f", "tenantName": "Newgrove" }, { "tenantId": "8982ed18-1e32-487f-884e-93583c29c61c", "tenantName": "Paddy Power Betfair" }, { "tenantId": "c9e63704-2c59-4122-8b69-3f7e49bd1e4b", "tenantName": "Well" }, { "tenantId": "5e5b8f35-00cc-4484-a391-15b65717a73a", "tenantName": "Anytime Fitness (UK)" }, { "tenantId": "8d164e0e-aac5-4f0a-99a7-e7a39c0fffa0", "tenantName": "ReferenceData" }, { "tenantId": "d0e406b3-4f54-42f2-8300-3d79d41aa69c", "tenantName": "CeX" }, { "tenantId": "3a6d5a05-6816-4c3a-9902-689ade24c6e5", "tenantName": "LifestyleFitness" }, { "tenantId": "97cdb218-3d6a-43ad-8070-c3026452fdb6", "tenantName": "The Little Gym" }, { "tenantId": "2dcfca1a-c1dc-47b9-9d6f-671a7d3e597c", "tenantName": "CinemaNext" }, { "tenantId": "dd306d38-9629-432c-a7d3-aed4d6c3e232", "tenantName": "LawnTennisAssociation" }, { "tenantId": "c44f57d1-5494-4fc7-bd2a-dfb5c9932e4e", "tenantName": "BoyleSports" }, { "tenantId": "c8d8c240-2c9a-4c26-990c-c2d31c592c4e", "tenantName": "RoyalCaribbean" }, { "tenantId": "d1568fcd-0bf8-4714-ad15-91c9cc451181", "tenantName": "Curzon" }, { "tenantId": "df3bd44f-6d76-4b59-8fa0-2de7b190544d", "tenantName": "Fennies" }, { "tenantId": "ded44f29-0385-4125-a97c-9a7a96e15b4d", "tenantName": "Praesepe" }, { "tenantId": "aabb1777-fdb7-4a69-bdf4-36db913e6baf", "tenantName": "Serendipity2" }, { "tenantId": "dd35a26b-b581-4979-a3c5-9b9b79f486d1", "tenantName": "PostOffice" }], "databaseInfo": { "viewName": "vwCensus11_UK_Cars", "database": "PeriscopeReferenceDataLive", "numColumns": 34, "numRows": 232296 }, "insightInfo": { "insightable": true, "matchable": true } }
  //   , { "dataPackageId": "3095ad3e-d73f-48a0-b03e-7c01ec37d4fe", "metadata": { "$type": "Newgrove.Periscope.Data.Packaging.Metadata.DataPackageMetadata, Newgrove.Periscope.Data.Packaging, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", "datasetName": "Cars", "datasetAccuracy": "Unknown", "datasetCoverage": "UK", "datasetDescription": "Responses to UK Census 2011 - Cars Ownership", "datasetShapeType": "Polygon", "datasetSource": "Office for National Statistics", "datasetLastUpdated": "2017-01-01T00:00:00", "datasetNextUpdateAvailable": "2021-01-01T00:00:00", "datasetNextUpdatePlanned": "2021-01-01T00:00:00", "datasetDataVintage": "2011", "datasetInDefaultBuild": true, "datasetCopyright": "", "datasetNotes": "" }, "datasetNameAliases": [{ "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }], "layerGroupNames": [{ "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }], "zoomLevelSettings": { "maxHeatmapZoomLevel": null, "minHeatmapZoomLevel": null, "connectionString": "SharedResourcesV1ConnectionString", "containerName": null, "maxZoomLevel": 19, "minZoomLevel": 13, "maxClusteredZoomLevel": 12, "minClusteredZoomLevel": 6 }, "tenantsWithAccess": [{ "tenantId": "f90da5b5-ecae-46d0-95c5-42ef327b652f", "tenantName": "Newgrove" }, { "tenantId": "8982ed18-1e32-487f-884e-93583c29c61c", "tenantName": "Paddy Power Betfair" }, { "tenantId": "c9e63704-2c59-4122-8b69-3f7e49bd1e4b", "tenantName": "Well" }, { "tenantId": "5e5b8f35-00cc-4484-a391-15b65717a73a", "tenantName": "Anytime Fitness (UK)" }, { "tenantId": "8d164e0e-aac5-4f0a-99a7-e7a39c0fffa0", "tenantName": "ReferenceData" }, { "tenantId": "d0e406b3-4f54-42f2-8300-3d79d41aa69c", "tenantName": "CeX" }, { "tenantId": "3a6d5a05-6816-4c3a-9902-689ade24c6e5", "tenantName": "LifestyleFitness" }, { "tenantId": "97cdb218-3d6a-43ad-8070-c3026452fdb6", "tenantName": "The Little Gym" }, { "tenantId": "2dcfca1a-c1dc-47b9-9d6f-671a7d3e597c", "tenantName": "CinemaNext" }, { "tenantId": "dd306d38-9629-432c-a7d3-aed4d6c3e232", "tenantName": "LawnTennisAssociation" }, { "tenantId": "c44f57d1-5494-4fc7-bd2a-dfb5c9932e4e", "tenantName": "BoyleSports" }, { "tenantId": "c8d8c240-2c9a-4c26-990c-c2d31c592c4e", "tenantName": "RoyalCaribbean" }, { "tenantId": "d1568fcd-0bf8-4714-ad15-91c9cc451181", "tenantName": "Curzon" }, { "tenantId": "df3bd44f-6d76-4b59-8fa0-2de7b190544d", "tenantName": "Fennies" }, { "tenantId": "ded44f29-0385-4125-a97c-9a7a96e15b4d", "tenantName": "Praesepe" }, { "tenantId": "aabb1777-fdb7-4a69-bdf4-36db913e6baf", "tenantName": "Serendipity2" }, { "tenantId": "dd35a26b-b581-4979-a3c5-9b9b79f486d1", "tenantName": "PostOffice" }], "databaseInfo": { "viewName": "vwCensus11_UK_Cars", "database": "PeriscopeReferenceDataLive", "numColumns": 34, "numRows": 232296 }, "insightInfo": { "insightable": true, "matchable": true } }
  //   , { "dataPackageId": "3095ad3e-d73f-48a0-b03e-7c01ec37d4fj", "metadata": { "$type": "Newgrove.Periscope.Data.Packaging.Metadata.DataPackageMetadata, Newgrove.Periscope.Data.Packaging, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", "datasetName": "Cars", "datasetAccuracy": "Unknown", "datasetCoverage": "UK", "datasetDescription": "Responses to UK Census 2011 - Cars Ownership", "datasetShapeType": "Polygon", "datasetSource": "Office for National Statistics", "datasetLastUpdated": "2017-01-01T00:00:00", "datasetNextUpdateAvailable": "2021-01-01T00:00:00", "datasetNextUpdatePlanned": "2021-01-01T00:00:00", "datasetDataVintage": "2011", "datasetInDefaultBuild": true, "datasetCopyright": "", "datasetNotes": "" }, "datasetNameAliases": [{ "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }], "layerGroupNames": [{ "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }], "zoomLevelSettings": { "maxHeatmapZoomLevel": null, "minHeatmapZoomLevel": null, "connectionString": "SharedResourcesV1ConnectionString", "containerName": null, "maxZoomLevel": 19, "minZoomLevel": 13, "maxClusteredZoomLevel": 12, "minClusteredZoomLevel": 6 }, "tenantsWithAccess": [{ "tenantId": "f90da5b5-ecae-46d0-95c5-42ef327b652f", "tenantName": "Newgrove" }, { "tenantId": "8982ed18-1e32-487f-884e-93583c29c61c", "tenantName": "Paddy Power Betfair" }, { "tenantId": "c9e63704-2c59-4122-8b69-3f7e49bd1e4b", "tenantName": "Well" }, { "tenantId": "5e5b8f35-00cc-4484-a391-15b65717a73a", "tenantName": "Anytime Fitness (UK)" }, { "tenantId": "8d164e0e-aac5-4f0a-99a7-e7a39c0fffa0", "tenantName": "ReferenceData" }, { "tenantId": "d0e406b3-4f54-42f2-8300-3d79d41aa69c", "tenantName": "CeX" }, { "tenantId": "3a6d5a05-6816-4c3a-9902-689ade24c6e5", "tenantName": "LifestyleFitness" }, { "tenantId": "97cdb218-3d6a-43ad-8070-c3026452fdb6", "tenantName": "The Little Gym" }, { "tenantId": "2dcfca1a-c1dc-47b9-9d6f-671a7d3e597c", "tenantName": "CinemaNext" }, { "tenantId": "dd306d38-9629-432c-a7d3-aed4d6c3e232", "tenantName": "LawnTennisAssociation" }, { "tenantId": "c44f57d1-5494-4fc7-bd2a-dfb5c9932e4e", "tenantName": "BoyleSports" }, { "tenantId": "c8d8c240-2c9a-4c26-990c-c2d31c592c4e", "tenantName": "RoyalCaribbean" }, { "tenantId": "d1568fcd-0bf8-4714-ad15-91c9cc451181", "tenantName": "Curzon" }, { "tenantId": "df3bd44f-6d76-4b59-8fa0-2de7b190544d", "tenantName": "Fennies" }, { "tenantId": "ded44f29-0385-4125-a97c-9a7a96e15b4d", "tenantName": "Praesepe" }, { "tenantId": "aabb1777-fdb7-4a69-bdf4-36db913e6baf", "tenantName": "Serendipity2" }, { "tenantId": "dd35a26b-b581-4979-a3c5-9b9b79f486d1", "tenantName": "PostOffice" }], "databaseInfo": { "viewName": "vwCensus11_UK_Cars", "database": "PeriscopeReferenceDataLive", "numColumns": 34, "numRows": 232296 }, "insightInfo": { "insightable": true, "matchable": true } }
  //   , { "dataPackageId": "3095ad3e-d73f-48a0-b03e-7c01ec37d4fh", "metadata": { "$type": "Newgrove.Periscope.Data.Packaging.Metadata.DataPackageMetadata, Newgrove.Periscope.Data.Packaging, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", "datasetName": "Cars", "datasetAccuracy": "Unknown", "datasetCoverage": "UK", "datasetDescription": "Responses to UK Census 2011 - Cars Ownership", "datasetShapeType": "Polygon", "datasetSource": "Office for National Statistics", "datasetLastUpdated": "2017-01-01T00:00:00", "datasetNextUpdateAvailable": "2021-01-01T00:00:00", "datasetNextUpdatePlanned": "2021-01-01T00:00:00", "datasetDataVintage": "2011", "datasetInDefaultBuild": true, "datasetCopyright": "", "datasetNotes": "" }, "datasetNameAliases": [{ "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }, { "datasetName": "Cars" }], "layerGroupNames": [{ "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }, { "layerGroupName": "Residential Census (UK)" }], "zoomLevelSettings": { "maxHeatmapZoomLevel": null, "minHeatmapZoomLevel": null, "connectionString": "SharedResourcesV1ConnectionString", "containerName": null, "maxZoomLevel": 19, "minZoomLevel": 13, "maxClusteredZoomLevel": 12, "minClusteredZoomLevel": 6 }, "tenantsWithAccess": [{ "tenantId": "f90da5b5-ecae-46d0-95c5-42ef327b652f", "tenantName": "Newgrove" }, { "tenantId": "8982ed18-1e32-487f-884e-93583c29c61c", "tenantName": "Paddy Power Betfair" }, { "tenantId": "c9e63704-2c59-4122-8b69-3f7e49bd1e4b", "tenantName": "Well" }, { "tenantId": "5e5b8f35-00cc-4484-a391-15b65717a73a", "tenantName": "Anytime Fitness (UK)" }, { "tenantId": "8d164e0e-aac5-4f0a-99a7-e7a39c0fffa0", "tenantName": "ReferenceData" }, { "tenantId": "d0e406b3-4f54-42f2-8300-3d79d41aa69c", "tenantName": "CeX" }, { "tenantId": "3a6d5a05-6816-4c3a-9902-689ade24c6e5", "tenantName": "LifestyleFitness" }, { "tenantId": "97cdb218-3d6a-43ad-8070-c3026452fdb6", "tenantName": "The Little Gym" }, { "tenantId": "2dcfca1a-c1dc-47b9-9d6f-671a7d3e597c", "tenantName": "CinemaNext" }, { "tenantId": "dd306d38-9629-432c-a7d3-aed4d6c3e232", "tenantName": "LawnTennisAssociation" }, { "tenantId": "c44f57d1-5494-4fc7-bd2a-dfb5c9932e4e", "tenantName": "BoyleSports" }, { "tenantId": "c8d8c240-2c9a-4c26-990c-c2d31c592c4e", "tenantName": "RoyalCaribbean" }, { "tenantId": "d1568fcd-0bf8-4714-ad15-91c9cc451181", "tenantName": "Curzon" }, { "tenantId": "df3bd44f-6d76-4b59-8fa0-2de7b190544d", "tenantName": "Fennies" }, { "tenantId": "ded44f29-0385-4125-a97c-9a7a96e15b4d", "tenantName": "Praesepe" }, { "tenantId": "aabb1777-fdb7-4a69-bdf4-36db913e6baf", "tenantName": "Serendipity2" }, { "tenantId": "dd35a26b-b581-4979-a3c5-9b9b79f486d1", "tenantName": "PostOffice" }], "databaseInfo": { "viewName": "vwCensus11_UK_Cars", "database": "PeriscopeReferenceDataLive", "numColumns": 34, "numRows": 232296 }, "insightInfo": { "insightable": true, "matchable": true } }
  //   ,
  // ];

  constructor(
    private actions$: Actions,
    private referenceDataService: ReferenceDataService,
    private ReferenceDataStoreService: ReferenceDataStoreService
  ) {
  }

  loadReferenceDatas$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ReferenceDataActions.loadReferenceDatas),
      withLatestFrom(
        this.ReferenceDataStoreService.selectReferenceFilter$,
        this.ReferenceDataStoreService.selectReferenceSort$
      ),
      switchMap(([_, filter, sorting]) => {
        // return of(this.testData)
          return this.referenceDataService.getReferenceDataPackages()
          .pipe(
            // takeUntil(this.actions$.pipe(ofType(ReferenceDataActions.loadReferenceDatas))),
            switchMap((data: any) => {
              const tenants: ITenantsWithAccess[] = [];
              const _data = data.map(e => {
                const datasetNameAliases: any[] = e.datasetNameAliases.map((_e, index) => {
                  return {
                    tenantId: e.tenantsWithAccess[index].tenantId,
                    datasetName: _e.datasetName
                  }
                });
                const _tenantsWithAccess = this.toObject(e.tenantsWithAccess.map(_e => _e.tenantId));
                e.tenantsWithAccess
                  .filter(tenant => tenants.filter(_e => _e.tenantId == tenant.tenantId).length == 0)
                  .forEach(filteredTenant => {
                    tenants.push(filteredTenant);
                  });
                const _groupNames: string[] = uniq(
                  ArrayUtils.sortData(
                    e.layerGroupNames.map((_e, index) => {
                      return {
                        groupName: _e.layerGroupName
                      }
                    }),
                    'ASC',
                    'groupName').map(_e => _e.groupName));
                const groupsName = _groupNames.join(',');
                return {
                  ...e,
                  _tenantsWithAccess,
                  _groupNames,
                  groupsName,
                  datasetNameAliases: ArrayUtils.sortData(datasetNameAliases.map(_e => {
                    const index = tenants.findIndex(tenant => tenant.tenantId == _e.tenantId);
                    return {
                      index,
                      ..._e
                    }
                  }), 'ASC', 'index')
                }
              });
              const _filteredData = this.formatData(_data, filter, sorting);
              const _filteredTenants = this.formatTenants(tenants, filter.selectedTenants)
              return [
                ReferenceDataActions.loadReferenceDatasSuccess({ data: {data: _filteredData, tenants: _filteredTenants} }),
                ReferenceDataActions.changeFilter({ filter })
              ]
            }),
            catchError(error => of(ReferenceDataActions.loadReferenceDatasFailure({ error }))))
      }),
      catchError((error: any) => {
        return of(ReferenceDataActions.loadReferenceDatasFailure({ error }));
      })
    );
  });

  filterData$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        ReferenceDataActions.changeFilter,
        ReferenceDataActions.changeSort,
      ),
      withLatestFrom(
        this.ReferenceDataStoreService.selectReferenceData$,
        this.ReferenceDataStoreService.selectReferenceFilter$,
        this.ReferenceDataStoreService.selectReferenceSort$,
      ),
      switchMap(([_, referenceData, filter, sorting]) => {
        if(!referenceData) {
          return [];
        }
        const { data, tenants } = referenceData;
        const { selectedTenants } = filter;
        const _filteredData = this.formatData(data, filter, sorting);
        const _filteredTenants = this.formatTenants(tenants, selectedTenants)
        return [ReferenceDataActions.updateFilterData({ data: {data: _filteredData, tenants: _filteredTenants} })]
      }),
    );
  });


  selectedData$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        ReferenceDataActions.selectReferenceData,
      ),
      withLatestFrom(
        this.ReferenceDataStoreService.selectReferenceFilteredData$,
      ),
      switchMap(([_, { data, tenants }]) => {
        const { item, checked } = _;
        const _data = [...data];
        const index = _data.findIndex(e => e.dataPackageId === item.dataPackageId);
        if(index > -1){
          _data[index] = { ..._data[index], checked}
        }
        return [ReferenceDataActions.updateFilterData({
          data: {
            data: _data,
            tenants
          }
        })]
      }),
    );
  });

  selectedAllData$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        ReferenceDataActions.selectAllReferenceData,
      ),
      withLatestFrom(
        this.ReferenceDataStoreService.selectReferenceFilteredData$,
      ),
      switchMap(([_, { data, tenants }]) => {
        const { checked } = _;
        const _data = data.map(e => ({ ...e, checked }))
        return [ReferenceDataActions.updateFilterData({
          data: {
            data: _data,
            tenants
          }
        })]
      }),
    );
  });



  toObject(array: string[]) {
    const object = {};
    for (let index = 0; index < array.length; index++) {
      const element = array[index];
      object[element] = true;
    }
    return object
  }

  formatData(data: IReferenceData[], activeFilter: ReferenceDataFilter, activeSort: ISort): IReferenceData[] {
    const { term, selectedTenants, defaultBuildOnly } = activeFilter;
    const filtered: IReferenceData[] = this.filterData(data, term, selectedTenants, undefined, defaultBuildOnly);
    const tenants: ITenantsWithAccess[] = [];
    const _data = ArrayUtils.sortData(filtered.map(e => {
      e.tenantsWithAccess
        .filter(tenant => tenants.filter(_e => _e.tenantId == tenant.tenantId).length == 0)
        .forEach(filteredTenant => {
          tenants.push(filteredTenant);
        });
      return {
        ...e,
        _datasetNameAliases: uniq(e.datasetNameAliases.map(_e => {
          return `${_e.datasetName}`;
        }))
      }
    }), activeSort.type, activeSort.field, activeSort.fieldChild, activeSort.dataType);
    return _data;
  }

  formatTenants(tenants: ITenantsWithAccess[],selectedTenants: string[]): ITenantsWithAccess[] {
    if(!(selectedTenants && selectedTenants.length)){
      return ArrayUtils.sortData(tenants, 'ASC', 'tenantName')
    }
    return ArrayUtils.sortData(tenants.filter(e=>selectedTenants.includes(e.tenantId)), 'ASC', 'tenantName');
  }

  filterData(data: IReferenceData[], term: string, selectedTenants: string[], selectedLayers: string[], defaultBuildOnly: boolean = false) {
    const searchstring = term ? term.toLowerCase() : '';
    return filter([...data], (e: IReferenceData) => {
      let flag = true;
      if (searchstring) {
        flag = flag && (
          e.dataPackageId.toLowerCase().includes(searchstring) ||
          !!e.datasetNameAliases.filter(e=>e.datasetName.toLowerCase().includes(searchstring)).length ||
          !!e.layerGroupNames.filter(e => e.layerGroupName.toLowerCase().includes(searchstring)).length);
      }
      if (selectedTenants && selectedTenants.length) {
        flag = flag && !!selectedTenants.filter(_tenantId => e.tenantsWithAccess.filter(tenant => tenant.tenantId == _tenantId).length).length;
      }
      if (selectedLayers && selectedLayers.length) {
        flag = flag && !!selectedLayers.includes(e.dataPackageId);
      }
      if(defaultBuildOnly){
        flag = flag && !!e.metadata.datasetInDefaultBuild
      }
      return flag;
    })
  }

}
