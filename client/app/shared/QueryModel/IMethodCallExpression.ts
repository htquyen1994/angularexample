import {IExpression} from './IExpression';

export interface IMethodCallExpression extends IExpression {
    Expression: IExpression;
    MethodName: string;
    Arguments: any;
}
