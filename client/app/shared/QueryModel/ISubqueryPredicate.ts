import {IBinaryPredicate} from './IBinaryPredicate';
import {SubqueryOperator} from './SubqueryOperator';
import {SubqueryExpression} from './SubqueryExpression';

export interface ISubqueryPredicate extends IBinaryPredicate<SubqueryOperator> {
    Other: SubqueryExpression;
}
