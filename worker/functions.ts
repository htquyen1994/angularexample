import { Field } from "../client/app/shared/Data/Packaging/Field";
// import { ISchema } from "../client/app/shared/Data/Packaging/ISchema";
import { DataTypeFlags } from "../client/app/shared/Data/Packaging/DataTypeFlags";
// import { GeoJsonFeature, IGeometry } from "../client/app/shared/map-utils/shapes";
import { IFilterJunction } from "../client/app/shared/enums/fiter-enums";
import { IPredicate } from "../client/app/shared/QueryModel/IPredicate";
import { Predicate } from "../client/app/shared/QueryModel/Predicate";
import { Expression } from "../client/app/shared/QueryModel/Expression";
import { TYPE } from "../client/app/shared/QueryModel/TYPE";
import { OperatorUtil } from "../client/app/shared/QueryModel/OperatorUtil";
import { ConstantCollectionExpression } from "../client/app/shared/QueryModel/ConstantCollectionExpression";
import { SpatialBinaryPredicate } from "../client/app/shared/QueryModel/SpatialBinaryPredicate";
import { BinaryPredicate } from "../client/app/shared/QueryModel/BinaryPredicate";
import { Operator } from "../client/app/shared/QueryModel/Operator";
import { NullabilityPredicate } from "../client/app/shared/QueryModel/NullabilityPredicate";
import { Junction } from "../client/app/shared/QueryModel/Junction";
import { JunctionOperator } from "../client/app/shared/QueryModel/JunctionOperator";
import { IExpression } from "../client/app/shared/QueryModel/IExpression";
import { PropertyExpression } from "../client/app/shared/QueryModel/PropertyExpression";
import { ConstantExpression } from "../client/app/shared/QueryModel/ConstantExpression";

export class LayerDataFunction {
    static getPredicate(filter: any, layer: any): IPredicate[] {
        if (!filter) {
            return [];
        }

        const predicate: any[] = [];
        Object.keys(filter.filters).forEach((columnName: string) => {

            const filterGroup = filter.filters[columnName];

            if (filterGroup.length > 1) {
                if (filter.junctions[columnName] === IFilterJunction.OR) {
                    predicate.push(Predicate.Or(
                        filter.filters[columnName].map(
                            x => LayerDataFunction.getPredicatePartial('', x.operator, x.value, columnName, layer.schema))));
                } else {
                    predicate.push(Predicate.And(
                        filter.filters[columnName].map(
                            x => LayerDataFunction.getPredicatePartial('', x.operator, x.value, columnName, layer.schema))));
                }
            } else {
                filter.filters[columnName].forEach(x => {
                    predicate.push(LayerDataFunction.getPredicatePartial('', x.operator, x.value, columnName, layer.schema));
                });
            }
        });
        const column = layer.columns.find(_ => _.isDefaultGeometry);
        if (filter.shape) {
            predicate.push(LayerDataFunction.getPredicatePartial('', filter.shape.operator, filter.shape.value,
                column.id, layer.schema));
        }
        if (filter.viewportShape) {
          predicate.push(LayerDataFunction.getPredicatePartial('', 'SpatialBinaryOperator.Intersects', filter.viewportShape,
            column.id, layer.schema));
        }

        return predicate;
    }

    private static getPredicatePartial(layerId: string, operator: string, value: any, columnName: string, schema: any): IPredicate {
        const opKey = operator.split('.')[0];

        const type: TYPE = LayerDataFunction.getTypeForField(schema, columnName);

        switch (opKey) {

            case 'BinaryOperator':
                return Predicate.Binary(Expression.Property(layerId, columnName, type),
                    OperatorUtil.GetOperator(operator),
                    Expression.Constant(value, type));
            case 'CollectionBinaryOperator':
                    if(value instanceof  Array) {
                        value = value.map(e=>{
                          return e == '[IS NULL]' ? null : e;
                        })
                      }
                return Predicate.Collection(Expression.Property(layerId, columnName, type),
                    OperatorUtil.GetOperator(operator),
                    <ConstantCollectionExpression>Expression.Constant(value, type));
            case 'StringBinaryOperator':
                return Predicate.String(Expression.Property(layerId, columnName, type),
                    OperatorUtil.GetOperator(operator),
                    Expression.Constant(value, type), false);
            case 'SpatialBinaryOperator':
                return Predicate.Intersects(Expression.Property(layerId, columnName, type), value);
            case 'NullabilityOperator':
                return Predicate.IsNull(Expression.Property(layerId, columnName, type));

            default:
                throw new Error('Predicate type not implemented ' + opKey);

        }
    }
    static getTypeForField(schema: any, columnName: string) {
        const field = schema._fieldsByIndex[schema._indicesByKey[columnName]];
        if (!field) {
            return null;
        }
        if (Field.hasFlag(field, DataTypeFlags.Boolean)) {
            return TYPE.boolean;
        }
        if (Field.hasFlag(field, DataTypeFlags.String)) {
            return TYPE.string;
        }
        if (Field.hasFlag(field, DataTypeFlags.Number)) {
            return TYPE.number;
        }
        if (Field.hasFlag(field, DataTypeFlags.DateTime)) {
            return TYPE.datetime;
        }
        if (Field.hasFlag(field, DataTypeFlags.Geometry)) {
            return TYPE.shape;
        }

        throw new Error('notimplemented');
    }

    static createFeatureFilter(predicates: IPredicate[], schema: any): (feature: any) => boolean {

        if (!(predicates) || predicates.length === 0) {
            return (a: any) => true;
        }

        const subFilters = Array<(feature: any) => boolean>();

        for (let i = 0; i < predicates.length; i++) {
            // build up sub filter methods
            const pred = predicates[i];

            if (pred instanceof SpatialBinaryPredicate) {
                const sbpred = <SpatialBinaryPredicate>pred;
                const lhsAccessor = this.getAccessorForExpression(sbpred.Expression);
                const rhsAccessor = this.getAccessorForExpression(sbpred.Other);
                subFilters.push((feature: any) => <boolean>(<(a: any, b: any) =>
                    boolean>sbpred.Operator.Filter)(lhsAccessor(feature), rhsAccessor(feature)));
            } else if (pred instanceof BinaryPredicate) {
                const bpred = <BinaryPredicate<Operator>>pred;

                const lhsAccessor = this.getAccessorForExpression(bpred.Expression);
                const rhsAccessor = this.getAccessorForExpression(bpred.Other);

                subFilters.push((feature: any) => <boolean>(<(a: any, b: any) =>
                    boolean>bpred.Operator.Filter)(lhsAccessor(feature), rhsAccessor(feature)));
            } else if (pred instanceof NullabilityPredicate) {

                const bpred = <BinaryPredicate<Operator>>pred;
                const lhsAccessor = this.getAccessorForExpression(bpred.Expression);

                subFilters.push((feature: any) => <boolean>(<(a: any) => boolean>bpred
                    .Operator.Filter)(lhsAccessor(feature)));
            } else if (pred instanceof Junction) {
                const junc = <Junction>pred;

                const mapped = junc.Predicates.map(x => this.createFeatureFilter([x], schema));

                switch (junc.Operator.Name) {
                    case JunctionOperator.Or.Name: {
                        subFilters.push((feature: any) => mapped.some(a => a(feature)));
                        break;
                    }
                    default: {
                        subFilters.push((feature: any) => mapped.every(a => a(feature)));
                        break;
                    }
                }
            } else {
                throw new Error(pred.Type + ' not implemented');
            }
        }

        return (a: any) => {
            return subFilters.every((flt, i) => flt(a));
        };
    }

    private static getAccessorForExpression(expr: IExpression): (feature: any) => any {

        if (expr instanceof PropertyExpression) {
            const pex = <PropertyExpression>expr;

            let propertyName = pex.PropertyName;

            // jd:hack because the schema will likely list the column as "geom" however the geojson spec requires "geometry"
            propertyName = (propertyName.toLowerCase() === 'geom') ? 'geometry' : propertyName;

            if (propertyName.toLowerCase() === 'geometry') {
                return (feature: any) => feature.geometry ? feature.geometry : feature.CentroidGeom ;
            }

            return (feature: any) => pex.ReturnType.Converter(
                (feature.properties) ?
                    (<{ [key: string]: any }>feature.properties)[propertyName] :
                    (<{ [key: string]: any }>feature)[propertyName]);
        }
        if (expr instanceof ConstantCollectionExpression) {
            const ccexpr: ConstantCollectionExpression = <ConstantCollectionExpression>expr;

            const arr = ccexpr.Values.map(a => expr.ReturnType.Converter(a));
            return (feature: any) => arr;

        }
        if (expr instanceof ConstantExpression) {
            const cexpr = <ConstantExpression>expr;
            return (feature: any) => cexpr.ReturnType.Converter(cexpr.Value);
        }

        throw new Error('Not implemented');
    }
}
