import {ExpressionBase} from './ExpressionBase';

export class SelfExpression extends ExpressionBase {
    Type = 'SelfExpression';

    constructor(args?: any) {
        super(args);
    }
}
