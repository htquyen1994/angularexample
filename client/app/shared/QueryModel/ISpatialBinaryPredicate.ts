import {IBinaryPredicate} from './IBinaryPredicate';
import {SpatialBinaryOperator} from './SpatialBinaryOperator';
import {ISpatialExpression} from './ISpatialExpression';

export interface ISpatialBinaryPredicate extends IBinaryPredicate<SpatialBinaryOperator> {
	Other: ISpatialExpression;
}
