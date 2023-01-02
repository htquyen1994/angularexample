import { MEMBERSHIP_LEVEL } from "../../shared/models/membershipLevel";

export interface Tenant {
    id: number;
    name: string;
    legalEntity: string;
    url: string;
    enabled: boolean;
    allowed_domains: { [recordId: string]: string };
    membership: Array<{
        id: string;
        name: string
        maxUsers: number;
    }>;
}

export interface GazetteerSettings {
    name: string;
    tenantGazetteer: boolean;
    googlePlaces: boolean;
    bng: boolean;
    latLng: boolean;
    nearest: boolean;
}

export interface StartSettings {
    resultPanelState: ResultPanelState;
    sidePanelState: boolean; // Hidden = true, Shown = false
    activeTab: ActiveSidePanelTab;
    mapType: MapTypes;
    mapTool: MapTools;
}

// ref: account.service.ts - these should match.
export interface FunctionalitySettings {
    editFilter: MEMBERSHIP_LEVEL[];
    editSymbology: MEMBERSHIP_LEVEL[];
    editLayerGroup: MEMBERSHIP_LEVEL[];
    createUserLayer: MEMBERSHIP_LEVEL[];
    canCreateCsv: MEMBERSHIP_LEVEL[];
    createIsogram: MEMBERSHIP_LEVEL[];
    viewNearest: MEMBERSHIP_LEVEL[];
    viewInsight: MEMBERSHIP_LEVEL[];
    runBatch: MEMBERSHIP_LEVEL[];
    createMatch: MEMBERSHIP_LEVEL[];
    canSplit: MEMBERSHIP_LEVEL[];
    canPrint: MEMBERSHIP_LEVEL[];
    canSpatialFilter: MEMBERSHIP_LEVEL[];
    hasAdvancedStyling: MEMBERSHIP_LEVEL[];
    hideAddInsightView: MEMBERSHIP_LEVEL[];
    showBlankMapStyle: MEMBERSHIP_LEVEL[];
}

export enum ResultPanelState {
    Hidden = 0,
    HalfShown = 1,
    FullyExpanded = 2
}

export enum ActiveSidePanelTab {
    Places = 1,
    Layers = 2
}

export enum MapTypes {
    Roadmap = 'roadmap',
    RoadMapBw = 'roadmap_bw',
    Terrain = 'terrain',
    Hybrid = 'hybrid',
    Simple = 'simple_map'
}

export enum MapTools {
    Info = 'info',
    Select = 'select'
}
