import {ExpressionBase} from './ExpressionBase';
import {IGroupedExpression} from './IGroupedExpression';
import {IExpression} from './IExpression';
import {applyArgs} from './QMUtil';

export class GroupedExpression extends ExpressionBase implements IGroupedExpression {
    Expression: IExpression = null;
    Type = 'GroupedExpression';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return this.Expression.Describe() + '(Grouped)';
    }
}
