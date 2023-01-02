import {ICollectionExpressionBase} from './ICollectionExpressionBase';
import {IExpression} from './IExpression';

export interface ICollectionExpression extends ICollectionExpressionBase, IExpression {
	Values: any[];
}
