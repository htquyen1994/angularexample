export interface MathInput {
    outputs: MathInputItem[];
    text: string;
}

export interface MathInputItem {
    type: MathInputType;
    value: MathInputObject;
    indexs?: number[];
    color?: string;
}

export interface MathInputObject {
    id: string;
    value: string;
    display: string;
}

export enum MathInputType {
    Keyword,
    Column,
    Function,
    Operator,
    String,
    Boolean,
    Datetime
}

export function getMathInputItemNull(): MathInputItem{
    return {
        type: MathInputType.String,
        value: {
            id: null,
            value: null,
            display: '[BLANK]'
        }
    }
}
