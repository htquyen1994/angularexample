import { convertToIClaim, IClaim } from "./permisions";

export interface ILayer {
    id: string;
    name: string;
    availableClaims: IClaim[];
    groupName: string;
    programaticName: string;
}

export interface ILayerGroup {
    name: string,
    layerIds: string[]
}

export function convertToILayer(data, claims: IClaim[], groupName?: string): ILayer {
    const availableClaims = data['availableClaims'] ? Object.keys(data['availableClaims']) : [];
    return {
        id: data['dataPackageId'],
        name: data['dataPackageName'],
        availableClaims: availableClaims
            .map(e => convertToIClaim(e, claims, data['availableClaims'][e]))
            .filter(e => e),
        groupName: groupName,
        programaticName: data['programaticName']
    }
}

