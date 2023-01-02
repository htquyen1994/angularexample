import {IExpression} from './IExpression';

export interface IGroupedExpressionBase extends IExpression {
    Expression: IExpression;
}
