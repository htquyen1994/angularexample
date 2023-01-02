import {Operator} from './Operator';
import {BinaryOperator} from './BinaryOperator';
import {StringBinaryOperator} from './StringBinaryOperator';
import {SpatialBinaryOperator} from './SpatialBinaryOperator';
import {CollectionBinaryOperator} from './CollectionBinaryOperator';

export class OperatorUtil {
    static GetOperator(operatorName: string): Operator {
        var parts = operatorName.split('.');
        var opType = parts[0];
        var op = parts[1];

        switch (opType) {
            case 'BinaryOperator':
                {
                    return <BinaryOperator>((<any>BinaryOperator)[op]);
                }
            case 'CollectionBinaryOperator':
                {
                    return <CollectionBinaryOperator>((<any>CollectionBinaryOperator)[op]);
                }
            case 'StringBinaryOperator':
                {
                    return <StringBinaryOperator>((<any>StringBinaryOperator)[op]);
                }
            case 'SpatialBinaryOperator':
                {
                    return <SpatialBinaryOperator>((<any>SpatialBinaryOperator)[op]);
                }
            default:
                throw 'Not Implemented';
        }

    }
}
