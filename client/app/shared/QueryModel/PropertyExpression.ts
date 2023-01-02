import {ExpressionBase} from './ExpressionBase';
import {applyArgs} from './QMUtil';

export class PropertyExpression extends ExpressionBase {
    ClassName: string = null;
    PropertyName: string = null;
    Type = 'PropertyExpression';

    constructor(args?: any) {
        super(args);
        applyArgs(this, args);
    }

    Describe(): string {
        return this.ClassName + '/' + this.PropertyName;
    }
}
