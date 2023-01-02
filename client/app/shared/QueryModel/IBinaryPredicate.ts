import {Operator} from './Operator';
import {IPredicate} from './IPredicate';
import {IExpression} from './IExpression';

export interface IBinaryPredicate<TOperator extends Operator> extends IPredicate {
    Expression: IExpression;
    Operator: TOperator;
    Other: IExpression;
}
