import {TYPE} from './TYPE';
import {IExpression} from './IExpression';
import {applyArgs} from './QMUtil';

export function GetType(obj: any): TYPE {
    if (typeof obj === 'number')
        return TYPE.number;
    if (typeof obj === 'boolean')
        return TYPE.boolean;
    if (typeof obj === 'string')
        return TYPE.string;
    if (obj instanceof Array) {
        var elType = GetType(obj[0]);
        return new TYPE(elType.Name + '[]', (a: any[]) => { a.map((b) => elType.Converter(b)); });
    }
    throw 'unknown datatype';
}

export module Expressions { //export class SpatialExpression extends Expression implements ISpatialExpression {
    //    Expression: IExpression = null;
    //    Type: string = 'SpatialExpression';
    //    Shape: any;
    //    ReturnType = TYPE.shape;
    //}
    export class ExpressionList implements IExpression {
        Expressions: IExpression[] = [];
        ReturnType: TYPE;
        Type: string = null;

        constructor(args?: any) {
            applyArgs(this, args);
        }

        Describe(): string {
            throw 'not implemented';
        }
    }
}
