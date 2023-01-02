import {PredicateBase} from './PredicateBase';
import {Operator} from './Operator';
import {IExpression} from './IExpression';
import {applyArgs} from './QMUtil';

export class SpecialPredicate extends PredicateBase {
    Operator: Operator = null;
    Other: IExpression = null;
    Type = 'SpecialPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return this.Expression.Describe() + ' Special: ' + this.Other.Describe();
    }
}
