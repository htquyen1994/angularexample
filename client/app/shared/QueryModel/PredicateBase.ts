import {IPredicate} from './IPredicate';
import {IExpression} from './IExpression';
import {Operator} from './Operator';
import {applyArgs} from './QMUtil';

export class PredicateBase implements IPredicate {
    Expression: IExpression = null;
    Operator: Operator = null;
    Type: string = null;

    constructor(args?: any) {
        applyArgs(this, args);
        if (!(this.Expression.ReturnType)) {
            throw 'Missing Expression.ReturnType';
        }
    }

    Describe(): string {
        throw 'override me';
    }
}
