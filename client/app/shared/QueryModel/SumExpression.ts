import {MathExpression} from './MathExpression';
import {MathOperator} from './MathOperator';
import {applyArgs} from './QMUtil';

export class SumExpression extends MathExpression {
    constructor(args?: any) {
        args.Operator = MathOperator.Sum;
        super(args);
        applyArgs(this, args);
    }
}
