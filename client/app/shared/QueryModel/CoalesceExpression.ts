import {ExpressionBase} from './ExpressionBase';
import {ICoalesceExpression} from './ICoalesceExpression';
import {IExpression} from './IExpression';
import {applyArgs} from './QMUtil';

export class CoalesceExpression extends ExpressionBase implements ICoalesceExpression {
    Expression: IExpression = null;
    DefaultValue: IExpression = null;
    Type = 'CoalesceExpression';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return + 'Coalesce(' + this.Expression.Describe() + ',' + this.DefaultValue.Describe() + ')';
    }
}
