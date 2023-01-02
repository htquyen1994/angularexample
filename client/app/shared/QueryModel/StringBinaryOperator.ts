import {Operator} from './Operator';

export class StringBinaryOperator extends Operator {

    constructor(name: string, description: string, filter: (a: string, b: string) => boolean) {
        super(name, description, filter);
    }

    static Equals = new StringBinaryOperator('StringBinaryOperator.Equals', 'Equals', (a: string, b: string) => a.toLowerCase() === b.toLowerCase());
    static NotEquals = new StringBinaryOperator('StringBinaryOperator.NotEquals', 'Does not equal', (a: string, b: string) => a.toLowerCase() !== b.toLowerCase());
    static StartsWith = new StringBinaryOperator('StringBinaryOperator.StartsWith', 'Starts with', (a: string, b: string) => a.toLowerCase().startsWith(b.toLowerCase()));

    static EndsWith = new StringBinaryOperator('StringBinaryOperator.EndsWith', 'Ends with', (a: string, b: string) => a.toLowerCase().endsWith(b.toLowerCase()));
    static Contains = new StringBinaryOperator('StringBinaryOperator.Contains', 'Contains', (a: string, b: string) => a.toLowerCase().indexOf(b.toLowerCase()) !== -1);
}
