import {IDataType} from './IDataType';

export interface IField {
    FieldType: string;
    Key: string;
    DataType: IDataType;
    Attributes: { [key: string]: any };
    Description : string;
    _picklistValues?: {
        elements: Array<{ name: string; value: any; description: string }>;
    };
}

export interface IFieldGroup {
    Index:number;
    Name:string;
    Description:string;
    HasTotal: boolean;
}
