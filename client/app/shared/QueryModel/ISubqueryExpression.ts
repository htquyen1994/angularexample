import {IExpression} from './IExpression';
import {Query} from './Query';
import {TYPE} from './TYPE';

export interface ISubqueryExpression extends IExpression {
    SubQuery: Query;
    EntityType: TYPE;
}
