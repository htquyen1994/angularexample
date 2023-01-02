import {TYPE} from './TYPE';

export interface IExpression {
    ReturnType: TYPE;
    Type: string;
    Describe(): string;
}
