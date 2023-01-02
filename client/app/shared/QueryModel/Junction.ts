import {PredicateBase} from './PredicateBase';
import {JunctionOperator} from './JunctionOperator';
import {IPredicate} from './IPredicate';
import {applyArgs} from './QMUtil';
import {ICollectionExpressionBase} from "./ICollectionExpressionBase";
import {TYPE} from "./Type";
import {ICollectionExpression} from './ICollectionExpression';

export class Junction extends PredicateBase {
    Operator: JunctionOperator = null;
    Expression: ICollectionExpression = null;
    Type = 'JunctionPredicate';

	get Predicates() {
		return <IPredicate[]> this.Expression.Values;
	}

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }
}
