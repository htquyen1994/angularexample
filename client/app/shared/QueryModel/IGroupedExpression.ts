import {IExpression} from './IExpression';
import {IGroupedExpressionBase} from './IGroupedExpressionBase';

export interface IGroupedExpression extends IExpression, IGroupedExpressionBase {
    Expression: IExpression;
}
