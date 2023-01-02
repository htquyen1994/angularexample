import {IPredicate} from './IPredicate';
import {Junction} from './Junction';
import {JunctionOperator} from './JunctionOperator';
import {IExpression} from './IExpression';
import {BinaryOperator} from './BinaryOperator';
import {SimpleBinaryPredicate} from './SimpleBinaryPredicate';
import {StringBinaryOperator} from './StringBinaryOperator';
import {StringBinaryPredicate} from './StringBinaryPredicate';
import {SpatialBinaryOperator} from './SpatialBinaryOperator';
import {TYPE} from './TYPE';
import {ISpatialExpression} from './ISpatialExpression';
import {SpatialBinaryPredicate} from './SpatialBinaryPredicate';
import {TextBinaryOperator} from './TextBinaryOperator';
import {ICollectionExpression} from './ICollectionExpression';
import {CollectionBinaryPredicate} from './CollectionBinaryPredicate';
import {CollectionBinaryOperator} from './CollectionBinaryOperator';
import {BetweenPredicate} from './BetweenPredicate';
import {SubqueryOperator} from './SubqueryOperator';
import {SubqueryExpression} from './SubqueryExpression';
import {SubqueryPredicate} from './SubqueryPredicate';
import {NullabilityPredicate} from './NullabilityPredicate';
import {NullabilityOperator} from './NullabilityOperator';
import {SpecialPredicate} from './SpecialPredicate';
import {Expression} from './Expression';
import {ConstantCollectionExpression} from './ConstantCollectionExpression';

export class Predicate {
    static And(predicates: IPredicate[]): Junction {
        return new Junction(
            {
                Operator: JunctionOperator.And,
                Expression: new ConstantCollectionExpression({Values : predicates, ReturnType: TYPE.boolean})
            });
    }

    static Or(predicates: IPredicate[]): Junction {
        return new Junction(
            {
                Operator: JunctionOperator.Or,
                Expression: new ConstantCollectionExpression({ Values: predicates, ReturnType: TYPE.boolean })
            });
    }

    static SimpleInternal(lhs: IExpression, op: BinaryOperator, rhs: IExpression):
        SimpleBinaryPredicate {
        const args = {
            Expression: lhs,
            Operator: op,
            Other: rhs
        };
        return new SimpleBinaryPredicate(args);
    }

    static Binary(lhs: IExpression, op: BinaryOperator, rhs: IExpression):
        SimpleBinaryPredicate {
        let handler: (a: IExpression, b: IExpression) => SimpleBinaryPredicate;
        switch (op) {
            case BinaryOperator.Equals:
                {
                    handler = Predicate.Equals;
                    break;
                }
            case BinaryOperator.GreaterThan:
                {
                    handler = Predicate.GreaterThan;
                    break;
                }
            case BinaryOperator.GreaterThanOrEqual:
                {
                    handler = Predicate.GreaterThanOrEqual;
                    break;
                }
            case BinaryOperator.LessThan:
                {
                    handler = Predicate.LessThan;
                    break;
                }
            case BinaryOperator.LessThanOrEqual:
                {
                    handler = Predicate.LessThanOrEqual;
                    break;
                }
            case BinaryOperator.NotEquals:
                {
                    handler = Predicate.NotEqual;
                    break;
                }
			case BinaryOperator.Between:
				{
					handler = Predicate.Between;
					break;
				}
            default:
                throw 'ArgumentException';
        }
        return handler(lhs, rhs);
    }

    static Equals(lhs: IExpression, rhs: IExpression): SimpleBinaryPredicate {
        return Predicate.SimpleInternal(lhs, BinaryOperator.Equals, rhs);
    }

    static LessThan(lhs: IExpression, rhs: IExpression): SimpleBinaryPredicate {
        return Predicate.SimpleInternal(lhs, BinaryOperator.LessThan, rhs);
    }

    static LessThanOrEqual(lhs: IExpression, rhs: IExpression): SimpleBinaryPredicate {
        return Predicate.SimpleInternal(lhs, BinaryOperator.LessThanOrEqual, rhs);
    }

    static GreaterThan(lhs: IExpression, rhs: IExpression): SimpleBinaryPredicate {
        return Predicate.SimpleInternal(lhs, BinaryOperator.GreaterThan, rhs);
    }

    static GreaterThanOrEqual(lhs: IExpression, rhs: IExpression): SimpleBinaryPredicate {
        return Predicate.SimpleInternal(lhs, BinaryOperator.GreaterThanOrEqual, rhs);
    }

    static NotEqual(lhs: IExpression, rhs: IExpression): SimpleBinaryPredicate {
        return Predicate.SimpleInternal(lhs, BinaryOperator.NotEquals, rhs);
    }
	static Between(lhs: IExpression, rhs: IExpression): SimpleBinaryPredicate {
		return Predicate.SimpleInternal(lhs, BinaryOperator.Between, rhs);
	}



	static String(lhs: IExpression,
        op: StringBinaryOperator,
        rhs: IExpression,
        caseSensitive: boolean): StringBinaryPredicate {
        let handler: (a: IExpression, b: IExpression, c: boolean) => StringBinaryPredicate;
        switch (op) {
            //case Operators.StringBinaryOperator.Contains:
            //    {
            //        handler = Predicate.StringContains;
            //        break;
            //    }
            case StringBinaryOperator.Equals:
                {
                    handler = Predicate.StringEquals;
                    break;
                }
            case StringBinaryOperator.NotEquals:
                {
                    handler = Predicate.StringNotEqual;
                    break;
                }
            case StringBinaryOperator.StartsWith:
                {
                    handler = Predicate.StringStartsWith;
                    break;
                }
            case StringBinaryOperator.EndsWith:
                {
                    handler = Predicate.StringEndsWith;
                    break;
                }
            case StringBinaryOperator.Contains:
                {
                    handler = Predicate.StringContainsPhrase;
                    break;
                }
            default:
                throw 'ArgumentException';
        }
        return handler(lhs, rhs, caseSensitive);
    }

    static WithinBounds(lhs: IExpression, shape: any) {
        //return Predicate.SpatialInternal(lhs,
        //    SpatialBinaryOperator.WithinBounds,
        //    {
        //        Shape: shape,
        //        Expression: { ReturnType: TYPE.shape },
        //        ReturnType: TYPE.shape,
        //        Type: 'shape',
        //        Describe: () => 'shape'
        //    } as ISpatialExpression);

		return Predicate.SpatialInternal(lhs,
			SpatialBinaryOperator.WithinBounds, (shape instanceof Expression) ? shape : Expression.Constant(shape, TYPE.shape));
    }

    static Intersects(lhs: IExpression, shape: any) {
        //return Predicate.SpatialInternal(lhs,
        //    SpatialBinaryOperator.Intersects,
        //    {
        //        Shape: shape,
        //        Expression: { ReturnType: TYPE.shape },
        //        ReturnType: TYPE.shape,
        //        Type: 'shape',
        //        Describe: () => 'shape'
        //    } as ISpatialExpression);


		return Predicate.SpatialInternal(lhs,
			SpatialBinaryOperator.Intersects, (shape instanceof Expression) ? shape : Expression.Constant(shape, TYPE.shape));
    }

    private static SpatialInternal(lhs: IExpression,
        op: SpatialBinaryOperator,
        rhs: ISpatialExpression): SpatialBinaryPredicate;
    private static SpatialInternal(lhs: IExpression,
	    op: SpatialBinaryOperator,
	    rhs: Expression): SpatialBinaryPredicate;
    private static SpatialInternal(lhs: IExpression, op: SpatialBinaryOperator, rhs: any):
        SpatialBinaryPredicate {
        const args = {
            Expression: lhs,
            Other: rhs,
            Operator: op
        };
        return new SpatialBinaryPredicate(args);
    }

    private static StringInternal(lhs: IExpression,
        op: StringBinaryOperator,
        rhs: IExpression,
        caseSensitive?: boolean): StringBinaryPredicate {
        const args = {
            CaseSensitive: caseSensitive,
            Expression: lhs,
            Operator: op,
            Other: rhs
        };
        return new StringBinaryPredicate(args);
    }

    //static StringContains(lhs: Expressions.IExpression, rhs: Expressions.IExpression, isCaseSensitive: boolean): StringBinaryPredicate {
    //    return Predicate.StringInternal(lhs, Operators.StringBinaryOperator.Contains, rhs, isCaseSensitive);
    //}
    static StringStartsWith(lhs: IExpression, rhs: IExpression, isCaseSensitive: boolean):
        StringBinaryPredicate {
        return Predicate.StringInternal(lhs, StringBinaryOperator.StartsWith, rhs, isCaseSensitive);
    }

    static StringEndsWith(lhs: IExpression, rhs: IExpression, isCaseSensitive: boolean):
        StringBinaryPredicate {
        return Predicate.StringInternal(lhs, StringBinaryOperator.EndsWith, rhs, isCaseSensitive);
    }

    static StringContainsPhrase(lhs: IExpression, rhs: IExpression, isCaseSensitive: boolean):
        StringBinaryPredicate {
        return Predicate.StringInternal(lhs, TextBinaryOperator.Contains, rhs, isCaseSensitive);
    }

    static StringFullText(lhs: IExpression, rhs: IExpression, isCaseSensitive: boolean):
        StringBinaryPredicate {
        return Predicate.StringInternal(lhs, TextBinaryOperator.FullText, rhs, isCaseSensitive);
    }


    static StringEquals(lhs: IExpression, rhs: IExpression, isCaseSensitive: boolean):
        StringBinaryPredicate {
        return Predicate.StringInternal(lhs, StringBinaryOperator.Equals, rhs, isCaseSensitive);
    }

    static StringNotEqual(lhs: IExpression, rhs: IExpression, isCaseSensitive: boolean):
        StringBinaryPredicate {
        return Predicate.StringInternal(lhs, StringBinaryOperator.NotEquals, rhs, isCaseSensitive);
    }

    static InCollection(lhs: IExpression, rhs: ICollectionExpression): CollectionBinaryPredicate {
        return Predicate.CollectionInternal(lhs, CollectionBinaryOperator.In, rhs);
    }

    static NotInCollection(lhs: IExpression, rhs: ICollectionExpression): CollectionBinaryPredicate {
        return Predicate.CollectionInternal(lhs, CollectionBinaryOperator.NotIn, rhs);
    }

    static Collection(lhs: IExpression,
        op: CollectionBinaryOperator,
        rhs: ICollectionExpression): CollectionBinaryPredicate {
        let handler: (a: IExpression, b: ICollectionExpression) => CollectionBinaryPredicate;
        switch (op) {
            case CollectionBinaryOperator.In:
                {
                    handler = Predicate.InCollection;
                    break;
                }
            case CollectionBinaryOperator.NotIn:
                {
                    handler = Predicate.NotInCollection;
                    break;
                }
            default:
                throw 'ArgumentException';
        }
        return handler(lhs, rhs);
    }

    static CollectionInternal(lhs: IExpression,
        op: CollectionBinaryOperator,
        rhs: ICollectionExpression): CollectionBinaryPredicate {
        const args = {
            Expression: lhs,
            Operator: op,
            Other: rhs
        };
        return new CollectionBinaryPredicate(args);
    }

    static Between_(lhs: IExpression, rhsMin: IExpression, rhsMax: IExpression): BetweenPredicate {
        return new BetweenPredicate(
            {
                Expression: lhs,
                Min: rhsMin,
                Max: rhsMax
            });
    }

    private static SubqueryInternal(lhs: IExpression,
        op: SubqueryOperator,
        subquery: SubqueryExpression): SubqueryPredicate {
        const args = {
            Expression: lhs,
            Operator: op,
            Other: subquery
        };
        return new SubqueryPredicate(args);
    }

    static Subquery(lhs: IExpression,
        op: SubqueryOperator,
        subquery: SubqueryExpression): SubqueryPredicate {
        let handler: (a: IExpression, b: SubqueryExpression) => SubqueryPredicate;
        switch (op) {
            case SubqueryOperator.In:
                {
                    handler = Predicate.InSubquery;
                    break;
                }
            case SubqueryOperator.NotIn:
                {
                    handler = Predicate.NotInSubquery;
                    break;
                }
            case SubqueryOperator.Except:
                {
                    handler = Predicate.ExceptSubquery;
                    break;
                }
            default:
                throw 'ArgumentException';
        }
        return handler(lhs, subquery);
    }

    static InSubquery(lhs: IExpression, subquery: SubqueryExpression): SubqueryPredicate {
        return Predicate.SubqueryInternal(lhs, SubqueryOperator.In, subquery);
    }

    static NotInSubquery(lhs: IExpression, subquery: SubqueryExpression): SubqueryPredicate {
        return Predicate.SubqueryInternal(lhs, SubqueryOperator.NotIn, subquery);
    }

    static ExceptSubquery(lhs: IExpression, subquery: SubqueryExpression): SubqueryPredicate {
        return Predicate.SubqueryInternal(lhs, SubqueryOperator.Except, subquery);
    }

    static In(self: IExpression, others: ICollectionExpression): CollectionBinaryPredicate {
        return Predicate.Collection(self, CollectionBinaryOperator.In, others);
    }

    static NotIn(self: IExpression, others: ICollectionExpression): CollectionBinaryPredicate {
        return Predicate.Collection(self, CollectionBinaryOperator.NotIn, others);
    }

    static IsNull(self: IExpression): NullabilityPredicate {
        return new NullabilityPredicate
            ({
                Expression: self,
                Operator: NullabilityOperator.IsNull
            });
    }

    static IsNotNull(self: IExpression): NullabilityPredicate {
        return new NullabilityPredicate
            ({
                Expression: self,
                Operator: NullabilityOperator.IsNotNull
            });
    }

    static Special(lhs: IExpression, op: string, rhs: IExpression): SpecialPredicate {
        return new SpecialPredicate
            ({
                Expression: lhs,
                Operator: op,
                Other: rhs
            });
    }
}
