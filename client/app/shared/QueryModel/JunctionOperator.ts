import {Operator} from './Operator';
import { Array } from 'core-js';

export class JunctionOperator extends Operator {
    constructor(name: string, description: string, filter: (lhs: any[]) => boolean) {
        super(name, description, filter);
    }

    static And = new JunctionOperator('JunctionOperator.And', 'All true', (lhs: any[]) => Array.every(lhs, a => a === true));
    static Or = new JunctionOperator('JunctionOperator.Or', 'Any true', (lhs: any[]) => Array.some(lhs, a => a === true));
    //static Xor = new JunctionOperator('JunctionOperator.Xor','Only one true');
}
