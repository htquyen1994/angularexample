import {BinaryPredicate} from './BinaryPredicate';
import {SpatialBinaryOperator} from './SpatialBinaryOperator';
import {applyArgs} from './QMUtil';

export class SpatialBinaryPredicate extends BinaryPredicate<SpatialBinaryOperator> {
    Type = 'SpatialBinaryPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return this.Expression.Describe() + ' ' + this.Operator.Description + ' ' + this.Other.Describe();
    }
}
