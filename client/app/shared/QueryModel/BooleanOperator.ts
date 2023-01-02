import {Operator} from './Operator';

export class BooleanOperator extends Operator {
    constructor(name: string, description: string, filter: (any: boolean) => boolean) {
        super(name, description, filter);
    }

    static True = new BooleanOperator('BooleanOperator.True', 'True', (a) => a);
    static False = new BooleanOperator('BooleanOperator.False', 'False', (a) => !a);
}
