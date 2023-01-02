import {IPredicate} from './IPredicate';
import {NullabilityOperator} from './NullabilityOperator';

export interface INullabilityPredicate extends IPredicate {
    Operator: NullabilityOperator;
}
