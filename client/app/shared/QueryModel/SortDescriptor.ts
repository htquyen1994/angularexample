import {IExpression} from './IExpression';
import {SortDirection} from './SortDirection';
import {applyArgs} from './QMUtil';

export class SortDescriptor {
    Expression: IExpression;
    Direction: SortDirection;

    constructor(args?: any) {
        applyArgs(this, args);
    }
}
