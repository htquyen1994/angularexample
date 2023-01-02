import {IDataView} from "./IDataView";
import {LayerSource} from "../../index";

export interface IDataPackage {
    Source: DataPackageSource;
    Id: string;
	  ProgramaticName: string;
	  JoinLayerType: string;
    DataViews: { [name: string]: IDataView; };
    Metadata: IDataPackageMetaData;
    DefaultDisplay?: boolean;
    DefaultActive?: boolean;
    ShowGroupHeaders?: boolean;
    HasInfo?: boolean;
    HasInsight?: boolean;
}

export enum DataPackageSource {
    Corporate = 1,
    User = Corporate << 1,
    Shared = (User << 1) | User,
}

export enum LabelPosition {
    Centred = 1,
    TopLeft = Centred << 1,
    TopRight = (TopLeft << 1) | TopLeft
}

export interface IDataPackageMetaData {
    DatasetName: string;
    DatasetOwner: string;
    DatasetDescription: string;
    Accuracy: string;
    Coverage: string;
    Created: Date;
    Modified: Date;
    Creator: string;
    Owner: string;
    ShapeType: string;
    DatasetShapeType: string;
    LayerBundleId?:string;
    DatasetVoronoiClip?: string[] ;
}

