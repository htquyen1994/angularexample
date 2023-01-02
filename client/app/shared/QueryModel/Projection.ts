import {IExpression} from './IExpression';
import {applyArgs} from './QMUtil';
import {TYPE} from './TYPE';
import {Expression} from './Expression';

export class Projection {
    Expression: IExpression = null;

    constructor(args?: any) {
        applyArgs(this, args);
    }

    static Project(expression: IExpression): Projection {
        return new Projection(
        {
            Expression: expression
        });
    }

    static Property<T, U>(className: string, propertyName: string, type: TYPE): Projection {
        return new Projection(
        {
            Expression: Expression.Property(className, propertyName, type)
        });
    }

    static GroupedProperty(className: string, propertyName: string, type: TYPE): Projection {
        return new Projection(
        {
            Expression: Expression.GroupedProperty(className, propertyName, type)
        });
    }

    static Self(): Projection {
        return new Projection(
        {
            Expression: Expression.SelfExpression()
        });
    }

    static Projections(projections: IExpression[]): Projection {
        return new Projection(
        {
            Expression: Expression.List(projections)
        });
    }
}
