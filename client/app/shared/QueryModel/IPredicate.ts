import {Operator} from './Operator';
import {IExpression} from './IExpression';

export interface IPredicate {
    Expression: IExpression;
    Operator: Operator;
    Type: string;
    Describe(): string;
}
