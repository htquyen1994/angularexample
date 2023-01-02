import {Operator} from './Operator';

export class CollectionBinaryOperator extends Operator {
    constructor(name: string, description: string, filter: (a: any, b: any[]) => boolean) {
        super(name, description, filter);
    }

    static In = new CollectionBinaryOperator('CollectionBinaryOperator.In', 'Is equal to', (a: any, b: any[]) => b.includes(a));
    static NotIn = new CollectionBinaryOperator('CollectionBinaryOperator.NotIn', 'Not equal to', (a: any, b: any[]) => !b.includes(a));
}
