import {MathExpression} from './MathExpression';
import {MathOperator} from './MathOperator';
import {applyArgs} from './QMUtil';

export class AvgExpression extends MathExpression {
    constructor(args?: any) {
        args.Operator = MathOperator.Avg;
        super(args);
        applyArgs(this, args);
    }
}
