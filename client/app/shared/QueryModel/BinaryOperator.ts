import { Operator } from './Operator';

export class BinaryOperator extends Operator {
  constructor(name: string, description: string, filter: (lhs: any, rhs: any) => boolean) {
    super(name, description, filter);
  }

  static Equals = new BinaryOperator('BinaryOperator.Equals', 'Equals', (a, b) => a != null && a != undefined && a === b);
  static NotEquals = new BinaryOperator('BinaryOperator.NotEquals', 'Not equal', (a, b) => a != null && a != undefined && a !== b);
  static LessThan = new BinaryOperator('BinaryOperator.LessThan', 'Less Than', (a, b) => a != null && a != undefined && a < b);
  static LessThanOrEqual = new BinaryOperator('BinaryOperator.LessThanOrEqual', 'Less than or equal to', (a, b) => a != null && a != undefined && a <= b);
  static GreaterThan = new BinaryOperator('BinaryOperator.GreaterThan', 'Greater Than', (a, b) => a != null && a != undefined && a > b);
  static GreaterThanOrEqual = new BinaryOperator('BinaryOperator.GreaterThanOrEqual', 'Greater than or equal to', (a, b) => a != null && a != undefined && a >= b);
  static Between = new BinaryOperator('BinaryOperator.Between', 'Between', (a, b) => a != null && a != undefined && a >= b[0] && a <= b[1]);
}
