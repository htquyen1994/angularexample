import {IExpression} from './IExpression';
import {MathOperator} from './MathOperator';

export interface IMathExpression extends IExpression {
    Operator: MathOperator;
    Expression: IExpression;
}
