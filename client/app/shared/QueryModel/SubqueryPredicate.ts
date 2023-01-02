import {BinaryPredicate} from './BinaryPredicate';
import {SubqueryOperator} from './SubqueryOperator';
import {ISubqueryPredicate} from './ISubqueryPredicate';
import {SubqueryExpression} from './SubqueryExpression';
import {applyArgs} from './QMUtil';

export class SubqueryPredicate extends BinaryPredicate<SubqueryOperator> implements ISubqueryPredicate {
    Other: SubqueryExpression = null;
    Type = 'SubqueryPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return this.Expression.Describe() + ' ' + this.Operator.Description + ' ' + this.Other.Describe();
    }
}
