import {ConstantExpression} from './ConstantExpression';
import {ICollectionExpression} from './ICollectionExpression';
import {TYPE} from './TYPE';
import {applyArgs} from './QMUtil';

export class ConstantCollectionExpression extends ConstantExpression implements ICollectionExpression {
    Values: any[] = [];
    ElementType: TYPE = null;
    Type = 'ConstantCollectionExpression';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return JSON.stringify(this.Values);
    }
}
