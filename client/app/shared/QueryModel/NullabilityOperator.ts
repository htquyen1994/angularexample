import {Operator} from './Operator';

export class NullabilityOperator extends Operator {
    constructor(name: string, description: string, filter: (a: any) => boolean) {
        super(name, description, filter);
    }

    static IsNull = new NullabilityOperator('NullabilityOperator.IsNull', 'Is Null or Undefined', (a) => !((a) && a != undefined));
    static IsNotNull = new NullabilityOperator('NullabilityOperator.IsNotNull', 'Is Not Null or Undefined', (a) => ((a) && a != undefined));
}
