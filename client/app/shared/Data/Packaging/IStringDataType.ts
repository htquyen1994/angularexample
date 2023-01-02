export interface IStringDataType {
    MinLength?: string;
    MaxLength?: string;
    ValidationRegex: string;
    DisallowEmptyStrings: boolean;
}