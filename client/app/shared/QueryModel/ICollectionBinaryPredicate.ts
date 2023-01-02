import {IBinaryPredicate} from './IBinaryPredicate';
import {CollectionBinaryOperator} from './CollectionBinaryOperator';
import {ICollectionExpression} from './ICollectionExpression';

export interface ICollectionBinaryPredicate extends IBinaryPredicate<CollectionBinaryOperator> {
	Other: ICollectionExpression;
}
