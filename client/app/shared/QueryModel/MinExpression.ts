import {MathExpression} from './MathExpression';
import {MathOperator} from './MathOperator';
import {applyArgs} from './QMUtil';

export class MinExpression extends MathExpression {
    constructor(args?: any) {
        args.Operator = MathOperator.Min;
        super(args);
        applyArgs(this, args);
    }
}
