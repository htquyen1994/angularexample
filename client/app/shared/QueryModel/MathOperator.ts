import {Operator} from './Operator';

let e = (a: number[]): number => {
    throw 'Not Implemented';
};

export class MathOperator extends Operator {
    constructor(name: string, description: string, filter: (lhs: number[]) => number) {
        super(name, description, filter);
    }

    static Avg = new MathOperator('MathOperator.Avg', 'Average', (arr: number[]) => { let a = 0; arr.forEach((v: number) => a += v); return a / arr.length });
    static Min = new MathOperator('MathOperator.Min', 'Min',
        (arr: number[]) => {
            let a = Number.MAX_VALUE;
            arr.forEach((v: number) => a = Math.min(a, v));
            return a;
        });
    static Max = new MathOperator('MathOperator.Max', 'Max', (arr: number[]) => {
        let a = Number.MIN_VALUE;
        arr.forEach((v: number) => a = Math.max(a, v));
        return a;
    });
    static Sum = new MathOperator('MathOperator.Sum', 'Sum',
        (arr: number[]) => {
            let a = 0;
            arr.forEach((v: number) => a += v);
            return a;
        });
}
