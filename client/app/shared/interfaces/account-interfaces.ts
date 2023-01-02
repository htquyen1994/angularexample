
export interface IAccount {
    allowEmailNotification: boolean;
    isProfesional: boolean;
    isMetric: boolean;
    filterByMap: boolean;
    pinSelected: boolean;
    username: string;
    forename: string;
    surname: string;
    tenantName: string;
    tenantShortName: string;
    tenantLiveUrl: string;
    isMarketView: boolean;

    createUserLayer: boolean;
    editFilter: boolean;
    editSymbology: boolean;
    editLayerGroup: boolean;
    viewNearest: boolean;
    viewInsight: boolean;
    isDevMode: boolean;
    canCopyToTenant: boolean;
    isSuperUser: boolean;
    isTenantAdmin: boolean;
    canSplit: boolean;
    createMatch: boolean;
    runBatch: boolean;
    canPrint: boolean;
    canSpatialFilter: boolean;
    hasAdvancedStyling: boolean;
    hideAddInsightView: boolean;
    shareFilter: boolean;
    shareStyle: boolean;
    shareInsightView: boolean;
    shareUserLayer: boolean;
    canQuickEdit: boolean;
    showLocationTools: boolean;
    showDrawingTools: boolean;
    showSelectionTools: boolean;
    showInformation: boolean;
    showInsights: boolean;
    showSplitShape: boolean;
    showPrintTool: boolean;
    showPointOfInterest: boolean;
    viewDocuments: boolean;
    viewTurnOffLayers: boolean;
    canDownloadInsight: boolean;
    canDownloadNearest: boolean;
    hasFollowLocation: boolean;
    advancedReporting: boolean;
    canIntersect: boolean;
    canCreateLayerFromFilter: boolean;
    canManageOrCalculateColumns: boolean;
    nonOverlapLabelMode: boolean;
    showIntersectionTool: boolean;
    showEnhancedReportingTool: boolean;
    showMyLocationTool: boolean;
    showFollowMeTool: boolean;
    version: string;
    drawShapeFillColour: string;
    drawShapeOpacity: number;
    drawShapeStrokeColour: string;
    showColumnGroups: boolean;
    showQuickEdit: boolean;
    showInsightCompact: boolean;
    showInsightPercentages: boolean;
    showInsightIndices: boolean;
    showZoomLevelIndicator: boolean;
    mapType: string;
    vectorMode: boolean;
    insightAutoRun: boolean;
    showNearest: boolean;
  
    defaultSearchType: number;
    hasQuickFilter: boolean;
    hasRouteWithDirections: boolean;
    showRouteWithDirections: boolean;
    hasOSMap: boolean;
    hasPOLSecurity: boolean;
    canDeleteDocuments: boolean;
    hasPOLTonch: boolean;
    hasMaxDownload: boolean;
    hasFind: boolean;
    hasAdvancedCatchments: boolean;
    hasTrafficWeightedCatchments: boolean;
}

export interface Account {
    username: string;
    email: string;
    isSuperUser: boolean;
}

export enum EPerformanceLevel{
  NEWGROVE = "newgrove",
  EXTREME = "extreme",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}
