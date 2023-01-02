import {DownloadType} from "./DownloadType";

export interface IDataInteraction {
    IsReadable: boolean;
    IsWritable: boolean;
    IsListable: boolean;
    IsComparable: boolean;
    IsShareable: boolean;
    IsEditable: boolean;
    IsCopyable: boolean;
    //DownloadType: DownloadType;
    IsDownloadable: boolean;
    IsRestrictedDownloadable: boolean;
}