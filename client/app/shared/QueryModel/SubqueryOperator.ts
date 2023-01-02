import {Operator} from './Operator';

let e = (a:any, b:any):boolean => {
    throw 'Not Implemented';
};

export class SubqueryOperator extends Operator {
    constructor(name: string, description: string) {
        super(name, description, e);
    }

    Describe(): string {
        throw 'not implemented';
    }

    static In = new SubqueryOperator('SubqueryOperator.In', 'In');
    static NotIn = new SubqueryOperator('SubqueryOperator.NotIn', 'Not In');
    static Except = new SubqueryOperator('SubqueryOperator.Except', 'Except');
}
