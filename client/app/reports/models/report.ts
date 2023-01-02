import { IFilter, ILayer } from "../../shared/interfaces";
import { Observable } from "rxjs";

export enum ReportFormat {
    EXCEL,
    PDF
}

export interface IReportRequest {
    reportId: string,
    reportFormat: ReportFormat,
    shapes: string;
    center: ICoordinate,
    zoomLevel: number,
    encodePaths: string[];
    userName: string;
    shapeCodes: string[];
    shapeId?: string;
}

export interface IReport {
    id: string,
    name: string,
    coverageRegions: string[],
    reportType?: ReportType
}

export interface IReportRespone {
    file: string;
    fileType: string;
    totalHits: number;
}

export interface ICoordinate {
    lat: number;
    lng: number;
}

export enum ReportType {
    DEFAULT,
    SELECTCLUB,
    SELECTPOINT,
    SELECTPOLYGONUNION,
    SELECTPOLYGON
}

export const VALIDATE_ROI = [
    'Ireland',
]

export const VALIDATE_UK = [
    'UK',
    'United Kingdom',
]

export const ISO3166 = [ //copy from ISO3166.json file
    {
        "name": "Ireland",
        "alpha-2": "IE",
        "country-code": "372"
    }, {
        "name": "United Kingdom of Great Britain and Northern Ireland",
        "alpha-2": "GB",
        "country-code": "826"
    }
]