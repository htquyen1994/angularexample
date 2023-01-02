import {ExpressionBase} from './ExpressionBase';
import {IMathExpression} from './IMathExpression';
import {MathOperator} from './MathOperator';
import {IExpression} from './IExpression';
import {TYPE} from './TYPE';

export class MathExpression extends ExpressionBase implements IMathExpression {
    Operator: MathOperator = null;
    Expression: IExpression = null;
    Type = 'MathExpression';

    constructor(args?: any) {
        super(args);
        if (this.Expression.ReturnType !== TYPE.number) {
            throw 'Argument';
        }
    }

    Describe(): string {
        return this.Operator.Description + '(' + this.Expression.Describe() + ')';
    }
}
