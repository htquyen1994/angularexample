import { ResponseLayerFieldType } from "@client/app/shared/interfaces";
import { IFieldGroup } from "@client/app/shared/Data/Packaging";

export enum ColumnAction {
    ADD = 'add',
    Modify = 'edit',
    Delete = 'delete'
}
export enum ECalculatorFunctions_TYPE {
    STRING,
    NUMBER,
    OPERATOR
}
export enum ECalculatorFunctions {
    PLUS,
    MINUS,
    MULTIPLY,
    DIVIDE,
    MIN,
    MAX,
    ROUND,
    CONCATENATE,
    UPPER,
    LOWER,
    PROPER,
    TRIM,
    LEN,
    REPLACE,
    AVG
}
export enum ExpectedStates {
    Function,
    Operator,
    Operand
}

export enum ICalculatorFunctionReturnType {
    string,
    number,
    boolean,
    datetime
}
export interface ICalculatorFunction {
    id: ECalculatorFunctions,
    name: string,
    type: ECalculatorFunctions_TYPE,
    precedence: number,
    associativity: "Right" | "Left",
    description?: string,
    output?:  ICalculatorFunctionReturnType,
    input?: ICalculatorFunctionReturnType,
    indexs?: number[]
}
export interface CustomCoulumnRequest {
    fieldGroups: IFieldGroup[],
    customColumnList: CustomColumn[],
    layerName: string
}

export interface CustomColumn {
    columnGroupId: any,
    // columnGroupName: string,
    columnName: string,
    columnDataType: ResponseLayerFieldType,
    columnAction: ColumnAction,
    columnId: any,
    columnIndex: number
}


export const CalculatorFunctions: ICalculatorFunction[] = [{
    id: ECalculatorFunctions.PLUS,
    name: '+',
    type: ECalculatorFunctions_TYPE.OPERATOR,
    associativity: 'Left',
    precedence: 2,
},
  {
    id: ECalculatorFunctions.MINUS,
    name: '-',
    type: ECalculatorFunctions_TYPE.OPERATOR,
    associativity: 'Left',
    precedence: 2
  },
  {
    id: ECalculatorFunctions.MULTIPLY,
    name: '*',
    type: ECalculatorFunctions_TYPE.OPERATOR,
    associativity: 'Left',
    precedence: 3
  },
  {
    id: ECalculatorFunctions.DIVIDE,
    name: '/',
    type: ECalculatorFunctions_TYPE.OPERATOR,
    associativity: 'Left',
    precedence: 3
  },
  {
    id: ECalculatorFunctions.AVG,
    name: 'Average',
    type: ECalculatorFunctions_TYPE.NUMBER,
    associativity: 'Left',
    precedence: 3,
    description: 'Find the average value in the dataset',
    output: ICalculatorFunctionReturnType.number,
    input: ICalculatorFunctionReturnType.number
  },
  {
    id: ECalculatorFunctions.MIN,
    name: 'Min',
    type: ECalculatorFunctions_TYPE.NUMBER,
    associativity: 'Left',
    precedence: 3,
    description: 'Find the minimum value in the dataset',
    output: ICalculatorFunctionReturnType.number,
    input: ICalculatorFunctionReturnType.number
  },
  {
    id: ECalculatorFunctions.MAX,
    name: 'Max',
    type: ECalculatorFunctions_TYPE.NUMBER,
    associativity: 'Left',
    precedence: 3,
    description: 'Find the maximum value in the dataset',
    output: ICalculatorFunctionReturnType.number,
    input: ICalculatorFunctionReturnType.number
},
//  {
//     id: ECalculatorFunctions.ROUND,
//     name: 'Round',
//     type: ECalculatorFunctions_TYPE.NUMBER,
//     associativity: 'Left',
//     precedence: 3
// },

// {
//     id: ECalculatorFunctions.CONCATENATE,
//     name: 'Concatenate',
//     type: ECalculatorFunctions_TYPE.STRING,
//     associativity: 'Left',
//     precedence: 3
// },
 {
    id: ECalculatorFunctions.UPPER,
    name: 'Upper',
    type: ECalculatorFunctions_TYPE.STRING,
    associativity: 'Left',
    precedence: 3,
    description: 'Convert to Upper Case',
    output: ICalculatorFunctionReturnType.string,
    input: ICalculatorFunctionReturnType.string
}, {
    id: ECalculatorFunctions.LOWER,
    name: 'Lower',
    type: ECalculatorFunctions_TYPE.STRING,
    associativity: 'Left',
    precedence: 3,
    description: 'Convert to Lower Case',
    output: ICalculatorFunctionReturnType.string,
    input: ICalculatorFunctionReturnType.string
},
//  {
//     id: ECalculatorFunctions.PROPER,
//     name: 'Proper',
//     type: ECalculatorFunctions_TYPE.STRING,
//     associativity: 'Left',
//     precedence: 3
// },
 {
    id: ECalculatorFunctions.TRIM,
    name: 'Trim',
    type: ECalculatorFunctions_TYPE.STRING,
    associativity: 'Left',
    precedence: 3,
    description: 'Remove leading and trailing whitespace',
    output: ICalculatorFunctionReturnType.string,
    input: ICalculatorFunctionReturnType.string
}, {
    id: ECalculatorFunctions.LEN,
    name: 'Len',
    type: ECalculatorFunctions_TYPE.STRING,
    associativity: 'Left',
    precedence: 3,
    description: 'Count the number of characters',
    output: ICalculatorFunctionReturnType.number,
    input: ICalculatorFunctionReturnType.string
}
// , {
//     id: ECalculatorFunctions.REPLACE,
//     name: 'Replace',
//     type: ECalculatorFunctions_TYPE.STRING,
//     associativity: 'Left',
//     precedence: 3
// }
]


// model for request
export interface ICalculateColumnRequest {
    AppliedRecords?: any[],
    AppliedColumn: string,
    AppliedColumnDataType: OperandType,
    CalculateExpression: ICalculateObject[],
    LayerName: string
}

export interface ICalculateObject {
    Type: CalculateType,
    OperatorValue: ECalculatorFunctions,
    OperandValue: ICalculateOperand,
    indexs?: number[]
}
export interface ICalculateOperand {
    IsColumn: boolean,
    DataType: OperandType,
    Value: any,
}


export enum CalculateType {
    OPERATOR,
    OPERAND
}

export enum OperandType {
    string,
    long,
    int,
    double,
    boolean,
    datetime
}
export enum CalculatorTab {
    Columns,
    Function,
}
