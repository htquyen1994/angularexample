import {PredicateBase} from './PredicateBase';
import {INullabilityPredicate} from './INullabilityPredicate';
import {IExpression} from './IExpression';
import {NullabilityOperator} from './NullabilityOperator';
import {applyArgs} from './QMUtil';

export class NullabilityPredicate extends PredicateBase implements INullabilityPredicate {
    Expression: IExpression = null;
    Operator: NullabilityOperator = null;
    Type = 'NullabilityPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe() {
        return this.Expression.Describe() + ' ' + this.Operator.Description;
    }
}
