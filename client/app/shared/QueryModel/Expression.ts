import {SelfExpression} from './SelfExpression';
import {IExpression} from './IExpression';
import {GroupedExpression} from './GroupedExpression';
import {PropertyExpression} from './PropertyExpression';
import {MethodCallExpression} from './MethodCallExpression';
import {TYPE} from './TYPE';
import {ConstantCollectionExpression} from './ConstantCollectionExpression';
import {ConstantExpression} from './ConstantExpression';
import {SubqueryExpression} from './SubqueryExpression';
import {Query} from './Query';
import {CoalesceExpression} from './CoalesceExpression';
import {SumExpression} from './SumExpression';
import {AvgExpression} from './AvgExpression';
import {MinExpression} from './MinExpression';
import {MaxExpression} from './MaxExpression';
import {Expressions} from './ExpressionList';


export class Expression {

	static SelfExpression(): SelfExpression {
		return new SelfExpression();
	}

	static Group(expression: IExpression): GroupedExpression {
		return new GroupedExpression(
			{
				Expression: expression,
				ReturnType: expression.ReturnType
			});
	}

	static GroupedProperty(className: string, propertyName: string, type: TYPE): GroupedExpression {
		const p = Expression.Group(Expression.Property(className, propertyName, type));
		return p;
	}

	static Property(className: string, propertyName: string, type: TYPE): PropertyExpression {
		return new PropertyExpression({
			ClassName: className,
			PropertyName: propertyName,
			ReturnType: type
		});
	}

	static MethodCall(expression: IExpression, methodName: string, args: any) {
		return new MethodCallExpression({
			Expression: expression,
			MethodName: methodName,
			Arguments: args
		});
	}

	static Substring(expression: IExpression, startIndex: number, length: number) {
		return Expression.MethodCall(expression,
			'SUBSTRING',
			{
				startIndex: startIndex,
				length: length
			});
	}

	static ConstantCollection(items: any[], type: TYPE): ConstantCollectionExpression {
		return new ConstantCollectionExpression(
			{
				Values: items.map((b) => (type) ? type.Converter(b) : b),
				ReturnType: type,
				ElementType: type
			});
	}

    static Constant(item: any, type: TYPE): ConstantExpression | ConstantCollectionExpression {
		if (item instanceof Array) {
			return Expression.ConstantCollection(item as any[], type);
		}
		return new ConstantExpression(
			{
				ReturnType: type,
				Value: type ? type.Converter(item) : item
			});
	}

	static Subquery(subQuery: Query): SubqueryExpression {
		return new SubqueryExpression(
			{
				SubQuery: subQuery
			});
	}

	static Coalesce(expression: IExpression, defaultValue: IExpression): CoalesceExpression {
		return new CoalesceExpression(
			{
				Expression: expression,
				DefaultValue: defaultValue
			});
	}

	static Sum(expr: IExpression): SumExpression {
		return new SumExpression(
			{
				Expression: expr
			});
	}

	static Avg(expr: IExpression): AvgExpression {
		return new AvgExpression(
			{
				Expression: expr
			});
	}

	static Min(expr: IExpression): MinExpression {
		return new MinExpression(
			{
				Expression: expr
			});
	}

	static Max(expr: IExpression): MaxExpression {
		return new MaxExpression(
			{
				Expression: expr
			});
	}

	static List(projections: IExpression[]): IExpression {
		return new Expressions.ExpressionList(
			{
				Expressions: projections
			});
	}
}
