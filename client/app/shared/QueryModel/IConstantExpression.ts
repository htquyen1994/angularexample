import {IConstantExpressionBase} from './IConstantExpressionBase';
import {IExpression} from './IExpression';

export interface IConstantExpression extends IConstantExpressionBase, IExpression {
    Value: any;
}
