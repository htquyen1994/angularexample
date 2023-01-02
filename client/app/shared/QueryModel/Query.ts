import {TYPE} from './TYPE';
import {Projection} from './Projection';
import {Predicate} from './Predicate';
import {SortDescriptor} from './SortDescriptor';
import {JoinHint} from './JoinHint';
import {applyArgs} from './QMUtil';
import {IExpression} from './IExpression';
import {SortDirection} from './SortDirection';

export class Query {
    EntityType: TYPE = null;
    Projection: Projection = null;
    Predicate: Predicate = null;
    Skip: number = null;
    Take: number = null;
    Sort: SortDescriptor[] = [];
    JoinHint: JoinHint = null;
    Type = 'Query';

    constructor(args?: any) {
        applyArgs(this, args);
    }

    AddSort(expression: IExpression, direction: SortDirection): Query {
        const descriptor = new SortDescriptor(
        {
            Expression: expression,
            Direction: direction
        });
        if (this.Sort == null) {
            this.Sort = ([] as SortDescriptor[]);
        }
        this.Sort.push(descriptor);
        return this;
    }

    static Create<TEntity>(projection: Projection,
        predicate: Predicate,
        skip: number,
        take: number,
        sortDescriptors: SortDescriptor[],
        joinHint: JoinHint): Query {
        return new Query(
        {
            Projection: projection,
            Predicate: predicate,
            Skip: skip,
            Take: take,
            JoinHint: joinHint,
            Sort: sortDescriptors == null
                ? null
                : sortDescriptors
        });
    }
}
