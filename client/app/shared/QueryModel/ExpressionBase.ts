import {IExpression} from './IExpression';
import {TYPE} from './TYPE';
import {applyArgs} from './QMUtil';

export class ExpressionBase implements IExpression {
    ReturnType: TYPE = null;
    Type: string = null;

    constructor(args?: any) {
        applyArgs(this, args);
    }

    Describe(): string {
        throw 'override me';
    }
}
