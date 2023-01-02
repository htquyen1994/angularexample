import {IFieldGroup, IField} from "./IField";

export interface ISchema {

    FieldGroups : Array<IFieldGroup>;
    _fieldsByIndex: Array<IField>;
    _indicesByKey: { [key: string]: number };
    //namespaces: Namespace.INamespace[]; //temp
    ProgramaticName:string;
    description: string; //temp

    GetFieldByIndex(idx: number): IField;
    GetFieldByKey(key: string): IField;
}
