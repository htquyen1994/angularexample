import {Operator} from './Operator';
import {PredicateBase} from './PredicateBase';
import {IBinaryPredicate} from './IBinaryPredicate';
import {IExpression} from './IExpression';
import {applyArgs} from './QMUtil';

export class BinaryPredicate<TOperator extends Operator> extends PredicateBase implements IBinaryPredicate<TOperator> {
    Expression: IExpression = null;
    Operator: TOperator = null;
    Other: IExpression = null;
    Type = 'BinaryPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
        if (this.Expression.ReturnType.Name !== this.Other.ReturnType.Name) {
            throw 'ReturnType mismatch between expressions';
        }
    }
}
