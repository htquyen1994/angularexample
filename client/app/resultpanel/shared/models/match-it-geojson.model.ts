import { GeoJsonFeature } from './../../../shared/map-utils/shapes';


export interface MatchItGeoJson
{
    type: string
    features: MatchItGeoJsonFeature[]
}

export interface MatchItGeoJsonFeature
{
    type: string
    properties: MatchItFeatureProperty
}

export interface MatchItFeatureProperty
{
    color: string
    geometry: MatchItGeometry
}

export interface MatchItGeometry
{
    type: string
    coordinates: any[]
}