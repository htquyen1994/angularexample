import {ExpressionBase} from './ExpressionBase';
import {ISubqueryExpression} from './ISubqueryExpression';
import {Query} from './Query';
import {TYPE} from './TYPE';
import {applyArgs} from './QMUtil';

export class SubqueryExpression extends ExpressionBase implements ISubqueryExpression {
    SubQuery: Query = null;
    EntityType: TYPE = null;
    Type = 'SubqueryExpression';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }
}
