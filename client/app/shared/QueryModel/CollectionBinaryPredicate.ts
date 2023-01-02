import {BinaryPredicate} from './BinaryPredicate';
import {CollectionBinaryOperator} from './CollectionBinaryOperator';
import {ICollectionBinaryPredicate} from './ICollectionBinaryPredicate';
import {ICollectionExpression} from './ICollectionExpression';
import {applyArgs} from './QMUtil';

export class CollectionBinaryPredicate extends BinaryPredicate<CollectionBinaryOperator> implements ICollectionBinaryPredicate {
    Other: ICollectionExpression = null;
    Type = 'CollectionBinaryPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe() {
        return this.Expression.Describe() + ' ' + this.Operator.Description + ' (' + this.Other.Describe() + ')';
    }
}
