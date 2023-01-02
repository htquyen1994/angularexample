import {IExpression} from './IExpression';
import {TYPE} from './TYPE';

export interface ICollectionExpressionBase extends IExpression {
    ElementType: TYPE;
    Values: any[];
}
