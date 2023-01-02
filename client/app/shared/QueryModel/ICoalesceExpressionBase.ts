import {IExpression} from './IExpression';

export interface ICoalesceExpressionBase extends IExpression {
    Expression: IExpression;
    DefaultValue: IExpression;
}
