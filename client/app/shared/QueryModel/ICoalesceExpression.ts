import {IExpression} from './IExpression';
import {ICoalesceExpressionBase} from './ICoalesceExpressionBase';

export interface ICoalesceExpression extends IExpression, ICoalesceExpressionBase {
    Expression: IExpression;
    DefaultValue: IExpression;
}
