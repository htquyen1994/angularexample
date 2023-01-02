import {ExpressionBase} from './ExpressionBase';
import {IMethodCallExpression} from './IMethodCallExpression';
import {IExpression} from './IExpression';
import {applyArgs} from './QMUtil';

export class MethodCallExpression extends ExpressionBase implements IMethodCallExpression {
    Expression: IExpression = null;
    Type = 'MethodCallExpression';
    MethodName: string = null;
    Arguments: any = null;

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return `Call (${this.MethodName} on ${this.Expression.Describe()} with arguments${JSON
            .stringify(this.Arguments)})`;
    }
}
