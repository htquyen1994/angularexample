import {IPredicate} from './IPredicate';
import {IExpression} from './IExpression';

export interface IBetweenPredicate extends IPredicate {
    Min: IExpression;
    Max: IExpression;
}
