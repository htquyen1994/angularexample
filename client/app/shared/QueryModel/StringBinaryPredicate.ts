import {BinaryPredicate} from './BinaryPredicate';
import {StringBinaryOperator} from './StringBinaryOperator';
import {applyArgs} from './QMUtil';
import {TYPE} from './TYPE';

export class StringBinaryPredicate extends BinaryPredicate<StringBinaryOperator> {
    CaseSensitive: boolean;
    Type = 'StringBinaryPredicate';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
        if (this.Expression.ReturnType.Name !== TYPE.string.Name && this.Expression.ReturnType.Name !== TYPE.text.Name) {
            throw 'Argument';
        }
    }

    Describe(): string {
        return this.Expression.Describe() + ' ' + this.Operator.Description + ' ' + this.Other.Describe();
    }
}
