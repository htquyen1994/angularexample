import {BinaryPredicate} from './BinaryPredicate';
import {BinaryOperator} from './BinaryOperator';
import {applyArgs} from './QMUtil';

export class SimpleBinaryPredicate extends BinaryPredicate<BinaryOperator> {
    Type = 'SimpleBinaryPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return this.Expression.Describe() + ' ' + this.Operator.Description + ' ' + this.Other.Describe();
    }
}
