import {PredicateBase} from './PredicateBase';
import {IBetweenPredicate} from './IBetweenPredicate';
import {IExpression} from './IExpression';
import {applyArgs} from './QMUtil';

export class BetweenPredicate extends PredicateBase implements IBetweenPredicate {
    Expression: IExpression = null;
    Min: IExpression = null;
    Max: IExpression = null;
    Type = 'BetweenPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return this.Expression.Describe() + ' between ' + this.Min.Describe() + ' and ' + this.Max.Describe();
    }
}
