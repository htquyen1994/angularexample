import {Operator} from './Operator';

let e = (a: string, b: string): boolean => {
    throw 'Not Implemented';
};

export class TextBinaryOperator extends Operator {
    constructor(name: string, description: string, filter: (lhs: string, rhs: string) => boolean) {
        super(name, description, filter);
    }

    static Contains = new TextBinaryOperator('StringBinaryOperator.Contains', 'Contains Word or Phrase', (a: string, b: string) => new RegExp(b,'i').test(a));
    static FullText = new TextBinaryOperator('StringBinaryOperator.FullText', 'Full Text Query - Lucene Syntax', e);
}
