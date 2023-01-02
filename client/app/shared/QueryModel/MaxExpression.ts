import {MathExpression} from './MathExpression';
import {MathOperator} from './MathOperator';
import {applyArgs} from './QMUtil';

export class MaxExpression extends MathExpression {
    constructor(args?: any) {
        args.Operator = MathOperator.Max;
        super(args);
        applyArgs(this, args);
    }
}
