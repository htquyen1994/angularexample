//export interface SchemaDescription {
//    name: string;
//    description: string;
//    fields?: SchemaField[];
//    namespaces?: SchemaDescription[];
//}

//export interface SchemaField {
//    name: string;
//    qualifiedName: string;
//    dsKey: string;
//    description: string;
//    typeInfo: string[];
//    attributes: any;
//    breadcrumb: string;
//    _picklistValues?: { elements: Array<{ value: any; description: string; }> }
//}
import {IField} from "./IField";
import {DataTypeFlags} from "./DataTypeFlags";
import {CommonMetaDataNames} from "./CommonMetaDataNames";

export class Field {

    static getName(f: IField): string {
        return f.Key;
    }

    static getDescription(f: IField): string {
        return (f.Description) && f.Description.trim().length > 0 ? f.Description : this.getAttribute(f, CommonMetaDataNames.Description);
    }

    static getFieldGroup(f: IField): number {
        return this.getAttribute(f, CommonMetaDataNames.FieldGroupId);
    }

    static getAttribute(f: IField, attrName: string): any {

        if (f === undefined)
            throw "Invalid field";

        var attrs = f.Attributes || {};

        return attrs[attrName];
    }

    static isPicklist(f: IField): boolean {
        return (this.getAttribute(f, CommonMetaDataNames.CreatePickList));
    }

    static isIdentifier(f: IField): boolean {
        return (this.getAttribute(f, CommonMetaDataNames.Identifier));
    }

    static isGeometry(f: IField): boolean {
        return (this.getAttribute(f, CommonMetaDataNames.DefaultGeometry));
    }

    static isCompulsory(f: IField): boolean {
        return (this.getAttribute(f, CommonMetaDataNames.Compulsory));
    }

    static isDefaultName(f: IField): boolean {
        return (this.getAttribute(f, CommonMetaDataNames.DefaultNameColumn));
    }

    static isReadonly(f: IField): boolean {
        return (this.getAttribute(f, CommonMetaDataNames.ReadOnly));
    }

    static isNotSortable(f: IField): boolean {
        return this.getAttribute(f, CommonMetaDataNames.NotSortable);
    }

    static isNotFilterable(f: IField): boolean {
        return this.getAttribute(f, CommonMetaDataNames.NotFilterable);
    }

    static isNotSelectable(f: IField): boolean {
        return this.getAttribute(f, CommonMetaDataNames.NotSelectable);
    }

    static getFlags(f: IField): DataTypeFlags {
        return f.DataType.Flags;
    }

    static hasFlag(f: IField, flag: DataTypeFlags) {
        return (this.getFlags(f) & flag)  === flag;
    }

    static createFlag(...flags: DataTypeFlags[]): DataTypeFlags {

        let f = <DataTypeFlags>0;

        for (var i = 0; i < flags.length; i++) {
            f = f | flags[i];
        }
        return f;
    }
}