import {ExpressionBase} from './ExpressionBase';
import {IConstantExpression} from './IConstantExpression';
import {applyArgs} from './QMUtil';

export class ConstantExpression extends ExpressionBase implements IConstantExpression {
    Value: any = null;
    Type = 'ConstantExpression';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return JSON.stringify(this.Value);
    }
}
