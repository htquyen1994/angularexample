import { Component, OnInit, NgZone, ChangeDetectorRef, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { IErrorResponse, createSimpleError, SelectionService, isNumeric, isNumericInt } from '../../shared';
import { DialogComponent } from '@client/app/shared/components';
import { ILayerColumnGroup, ILayer } from '../../shared/interfaces';
import * as _ from 'lodash';
import { ILayerColumnType } from '../../shared/enums';
import { decorateError } from '../../shared/http.util';
import { CalculatorFunctions, ICalculatorFunction, ECalculatorFunctions_TYPE, ICalculateObject, CalculateType, ICalculateOperand, OperandType, ECalculatorFunctions, ExpectedStates, CalculatorTab, ICalculatorFunctionReturnType } from '@client/app/shared/interfaces';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { ColumnManageService } from '../shared/services/column-manage.service';
import { MathInputService } from '../../shared/services';
import { MathInputType, MathInput, MathInputItem, getMathInputItemNull } from '../../shared/interfaces';
import { IListItem } from '../../shared/models/order-list.model';
import { LayerDataFunction } from '../../../../client_webworker/app-workers/shared/models/services/functions';
import { Field, DataTypeFlags } from '../../shared/Data/Packaging';
import * as moment from 'moment';
import { MatInput } from '@angular/material/input';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
  selector: 'go-calculate-column',
  templateUrl: './calculate-column.component.html',
  styleUrls: ['./calculate-column.component.less']
})
export class CalculateColumnComponent implements OnInit {
  @ViewChild('dialog', { static: true })
  dialog: DialogComponent;
  @ViewChild('calculateTextBox') calculateTextBox: ElementRef;
  @ViewChild('dateInput', {
    read: MatInput
}) dateInput: MatInput;

  loading: boolean = false;
  form: FormGroup;
  error: IErrorResponse;
  columnGroups: { index: any, name: string, children: { id: string, name: string, notSortable: any }[] }[];
  columnGroupOptions: PsSelectOption[] = [];
  availabelColumns: { id: string, name: string, notSortable: any }[] = [];
  updateForSelection: PsSelectOption[] = [
    {
      label: 'All records',
      value: 0
    },
    {
      label: 'Selected records',
      value: 1
    },
  ]
  CalculatorFunctions: ICalculatorFunction[] = _.cloneDeep(CalculatorFunctions);
  activeLayer: ILayer;
  selectedTab: CalculatorTab = CalculatorTab.Columns;
  CalculatorTab = CalculatorTab;
  listOperatorFunctions: ICalculatorFunction[];
  listColumns: IListItem[];
  listFunctions: IListItem[];
  calculatorError: IErrorResponse;
  searchStringColumn: string;
  searchStringFunction: string;
  get columnSelection() {
    const id = this.form && this.form.get('columnId') ? this.form.get('columnId').value : null;
    if (id) {
      const column = this.activeLayer ? this.activeLayer.columns.find(e => e.id == id) : null;
      return column ? column.name : null;
    }
    return null;
  }
  get columnDataType() {
    return this.getTypeForField(this.activeLayer.schema, this.form.get('columnId').value)
  }
  get columnDataAttribute() {
    return this.getFieldAttribute(this.activeLayer.schema, this.form.get('columnId').value)
  }
  operandType = OperandType;
  ECalculatorFunctions = ECalculatorFunctions;
  private unsubscribe$: Subject<void> = new Subject<void>();
  private requestSubscription: Subscription;
  constructor(
    private dialogRef: MatDialogRef<CalculateColumnComponent>,
    private ngZone: NgZone,
    private changeDetectorRef: ChangeDetectorRef,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private columnManageService: ColumnManageService,
    private selectionService: SelectionService,
    private mathInputService: MathInputService
  ) {
  }

  ngOnInit() {
    try {
      this.activeLayer = this.data['layer'];
      this.columnGroups = _.cloneDeep(this.activeLayer.columnGroups).map(e => {
        return {
          index: e.Index,
          name: e.Name,
          children: []
        }
      });
      this.activeLayer.columns
        .filter(item => !(item.notFilterable || item.notSelectable || item.type === ILayerColumnType.SHAPE || item.isPicklist))
        .forEach(column => {
          let index = this.columnGroups.findIndex(e => e.index == column.groupId);
          if (index != -1) {
            this.columnGroups[index].children.push({
              id: column.id,
              name: column.name,
              notSortable: column.notSortable
            });
            this.availabelColumns.push({
              id: column.id,
              name: column.name,
              notSortable: column.notSortable
            })
          } else {
            throw createSimpleError(`Cannot display filter for ${this.activeLayer.name} because one of more columns are assigned to a group that doesn't exist.`)
          }
        });
      this.columnGroupOptions = this.columnGroups.filter(e => e.children.length).map(e => ({
        value: e.index,
        label: e.name,
        items: e.children.filter(child=>!child.notSortable).map((child) => ({
          value: child.id,
          label: child.name
        }))
      }))
      this.newForm();
      this.setListColumns(_.cloneDeep(this.availabelColumns));
      this.setListFunctions(this.CalculatorFunctions.filter(e => e.type !== ECalculatorFunctions_TYPE.OPERATOR));
      this.setListOperatorFunctions(this.CalculatorFunctions.filter(e => e.type === ECalculatorFunctions_TYPE.OPERATOR))
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      this.onDialogClose(decorateError(error));
    }
  }

  ngAfterContentInit() {
    this.dialog.onHide(false);
  }

  ngOnDestroy(): void {
    this.unsubscribeFrom();
  }

  unsubscribeFrom() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  newForm() {
    this.form = this.fb.group({
      columnId: this.fb.control('', Validators.required),
      updateFor: 0,
      calculator: {
        outputs: [],
        text: ''
      } as MathInput,
      color: '#ffffff'
    })
    this.form.get('calculator').setValidators((control: FormControl) => {
      const value = control.value;
      return value && value.text ? null : {
        required: true
      };
    })
    this.form.get('columnId').valueChanges.pipe(debounceTime(200), takeUntil(this.unsubscribe$)).subscribe((columnId) => {
      this.validCalculator();
      this.changeDetectorRef.detectChanges();
    })
    this.form.get('calculator').valueChanges.pipe(debounceTime(200), takeUntil(this.unsubscribe$)).subscribe(value => {
      this.validCalculator();
      this.changeDetectorRef.detectChanges();
    })
  }

  setListColumns(availabelColumns = []) {
    this.listColumns = availabelColumns
  }

  setListFunctions(functions = []) {
    this.listFunctions = functions
  }

  setListOperatorFunctions(functions = []) {
    this.listOperatorFunctions = functions
  }

  onCancel() {
    this.onDialogClose();
  }

  onDialogClose(result?: any) {
    this.ngZone.run(() => {
      this.dialogRef.close(result);
    })
  }

  setLoading(value) {
    this.loading = value;
    this.changeDetectorRef.detectChanges();
  }

  onSubmit() {
    try {
      this.onRequest();
    } catch (err) {
      this.error = decorateError(err);
      this.setLoading(false);
    }
  }

  onRequest() {
    this.setLoading(true);
    this.cancelRequest();
    const rawData = this.form.getRawValue();
    const calculateExpression = this.columnDataAttribute && this.columnDataAttribute.Colour ? [this.colorToCalculateObject(rawData.color)]
      : this.mathParse(rawData.calculator.outputs)
    this.requestSubscription = this.columnManageService.columnCalculateRequest(this.activeLayer, {
      AppliedColumn: rawData.columnId,
      LayerName: this.activeLayer.name,
      CalculateExpression: calculateExpression,
      AppliedColumnDataType: this.getTypeForField(this.activeLayer.schema, rawData.columnId),
      AppliedRecords: rawData.updateFor == 1 ? Array.from(this.selectionService.selectionStore.get(this.activeLayer.id).values()) : null
    }).subscribe(res => {
      this.setLoading(false);
      this.onDialogClose({ success: true })
    }, err => {
      this.error = decorateError(err);
      this.setLoading(false);
    })
  }

  cancelRequest() {
    if (this.requestSubscription) {
      this.requestSubscription.unsubscribe();
      this.requestSubscription = null;
    }
  }

  onSelectTab(value) {
    this.selectedTab = value;
  }

  onClickOperator(operator: ICalculatorFunction) {
    this.mathInputService.onSelect({ type: MathInputType.Operator, value: { id: operator.id.toString(), value: operator.name, display: operator.name } })
  }

  onChangeColumn(column) {
    this.mathInputService.onSelect({ type: MathInputType.Column, value: { id: column.id, value: column.name, display: column.name } })
  }

  onChangeFunction(func) {
    this.mathInputService.onSelect({ type: MathInputType.Function, value: { id: func.id, value: func.name, display: func.name } })
  }

  onClickBoolean(value) {
    this.mathInputService.onSelect({ type: MathInputType.Boolean, value: { id: null, value: value, display: value ? 'TRUE' : 'FALSE', } })
  }

  onClickNull() {
    this.mathInputService.onSelect(getMathInputItemNull());
  }

  onDateChange(value) {
    const date = value.value;
    if (value !== null && date.isValid()) {
      this.mathInputService.onSelect({
        type: MathInputType.Datetime,
        value: {
          id: null,
          value: date.add(date.utcOffset() * 60).format('YYYY-MM-DD'),
          display: date.format('DD/MM/YYYY'),
        }
      })
    }
    this.dateInput.value = '';
  }

  onSearch($event) {
    console.log($event);
    this.searchStringFunction = null;
    this.searchStringColumn = null;
    if ($event) {
      const searchString = $event.searchString as string;
      const tab = $event.tab as CalculatorTab;
      const isFirst = $event.isFirst as boolean;
      if (tab == CalculatorTab.Columns) {
        if (isFirst) {
          this.onSelectTab(CalculatorTab.Columns)
        }
        this.searchStringColumn = searchString;
      } else if (tab == CalculatorTab.Function) {
        if (isFirst) {
          this.onSelectTab(CalculatorTab.Function)
        }
        this.searchStringFunction = searchString;
      }
    }
  }

  validCalculator() {
    this.calculatorError = undefined;
    this.form.get('calculator').setErrors(null);
    this.form.get('color').setErrors(null);
    if (this.columnDataAttribute && this.columnDataAttribute.Colour) {
      const color = this.form.get('color').value;
      if (!color) {
        this.form.get('color').setErrors({ required: true });
      }
    } else {
      const value = this.form.get('calculator').value;
      try {
        if (value.outputs.length) {
          const rawData = this.form.getRawValue();
          this.expectResult(this.mathParse(value.outputs), this.getReturnTypeByOperandType(this.getTypeForField(this.activeLayer.schema, rawData.columnId)));
        } else {
          this.form.get('calculator').setErrors({ required: true })
        }
      } catch (error) {
        const err = decorateError(error);
        this.form.get('calculator').setErrors(err)
        this.calculatorError = err;
      }
    }
  }

  colorToCalculateObject(value: string): ICalculateObject {
    const object: ICalculateObject = {
      Type: CalculateType.OPERAND,
      OperandValue: { DataType: OperandType.string, IsColumn: false, Value: value },
      OperatorValue: null
    }
    return object;
  }

  praseTokens(arr: MathInputItem[]): Array<any> {
    let array: MathInputItem[] = [];
    let str = '';
    let arrIndex: number[] = [];
    for (let index = 0; index < arr.length; index++) {
      const element: MathInputItem = { ...arr[index], indexs: [index] };
      if (element.type == MathInputType.Column) {
        array = [...array, element];
      } else if (element.type == MathInputType.Function) {
        const data = this.checkAndResetString(str, arrIndex, array);
        array = data.array;
        arrIndex = data.arrIndex;
        str = data.str;
        const func = this.listFunctions.find(e => e.id == element.value.id);
        array = [...array, {
          type: MathInputType.Function,
          value: { id: func.id, value: func.name, display: func.name },
          indexs: [index]
        }, {
          type: MathInputType.Keyword,
          value: { id: null, value: '(', display: func.name },
          indexs: [index]
        }];
      } else if (element.type == MathInputType.Operator) {
        const data = this.checkAndResetString(str, arrIndex, array);
        array = data.array;
        arrIndex = data.arrIndex;
        str = data.str;
        array = [...array, element];
      } else if (element.type == MathInputType.Keyword) {
        if (element.value.value.match(/([\(\)])/)) {
          const data = this.checkAndResetString(str, arrIndex, array);
          array = data.array;
          arrIndex = data.arrIndex;
          str = data.str;
          array = [...array, element];
        } else {
          str += element.value.value;
          arrIndex.push(index);
        }
      } else if (element.type == MathInputType.String) {
        const data = this.checkAndResetString(str, arrIndex, array);
        array = data.array;
        arrIndex = data.arrIndex;
        str = data.str;
        array = [...array, element];
      } else if (element.type == MathInputType.Boolean) {
        const data = this.checkAndResetString(str, arrIndex, array);
        array = data.array;
        arrIndex = data.arrIndex;
        str = data.str;
        array = [...array, element];
      } else if (element.type == MathInputType.Datetime) {
        const data = this.checkAndResetString(str, arrIndex, array);
        array = data.array;
        arrIndex = data.arrIndex;
        str = data.str;
        array = [...array, element];
      } else {
        throw createSimpleError(`Not Implement`, undefined, { indexs: [index] });
      }
      if (index == arr.length - 1) {
        const data = this.checkAndResetString(str, arrIndex, array);
        array = data.array;
        arrIndex = data.arrIndex;
        str = data.str;
      }
    }
    return array
  }

  checkAndResetString(str, arrIndex, array: MathInputItem[]) {
    if (str) {
      array = [...array, {
        type: MathInputType.Keyword,
        value: { id: null, value: str, display: str },
        indexs: arrIndex
      }]
      str = '';
      arrIndex = [];
    }
    return {
      str, arrIndex, array
    };
  }

  praseTokenOperand(item: MathInputItem): ICalculateOperand {
    let operand: ICalculateOperand;
    if (item.type == MathInputType.Column) {
      const column = this.activeLayer.columns.find(e => e.id == item.value.id)
      operand = {
        IsColumn: true,
        DataType: this.getTypeForField(this.activeLayer.schema, column.id),
        Value: column.id
      }
    } else if (item.type == MathInputType.String) {
      operand = {
        IsColumn: false,
        DataType: OperandType.string,
        Value: item.value.value
      }
    } else if (item.type == MathInputType.Boolean) {
      operand = {
        IsColumn: false,
        DataType: OperandType.boolean,
        Value: item.value.value
      }
    } else if (item.type == MathInputType.Datetime) {
      operand = {
        IsColumn: false,
        DataType: OperandType.datetime,
        Value: item.value.value
      }
    } else if (isNumeric(item.value.value)) {
      operand = {
        IsColumn: false,
        DataType: isNumericInt(item.value.value) ? OperandType.int : OperandType.double,
        Value: item.value.value
      }
    } else {
      throw createSimpleError(`Press ' to input as string`, undefined, { indexs: item.indexs });
    }
    return operand
  }

  // https://www.thepolyglotdeveloper.com/2015/03/parse-with-the-shunting-yard-algorithm-using-javascript/
  mathParse(arr: MathInputItem[]) {
    let outputQueue: ICalculateObject[] = [];
    let operatorStack: ICalculatorFunction[] = [];
    let operators = this.CalculatorFunctions;
    let expectedState: any[] = [
      ExpectedStates.Function,
      ExpectedStates.Operand,
      '('
    ];
    let countBrackets = 0;
    arr = this.praseTokens(arr);
    for (let i = 0; i < arr.length; i++) {
      let token = arr[i].type == MathInputType.Boolean ? arr[i].value.display : arr[i].value.value;
      let arrIndex = arr[i].indexs;
      this.checkToken(arr[i], expectedState);
      if (i == arr.length - 1) {
        this.checkLastToken(arr[i]);
      }
      if (arr[i].type == MathInputType.Function || arr[i].type == MathInputType.Operator) {
        if (arr[i].type == MathInputType.Function) {
          expectedState = [
            '('
          ]
        }
        if (arr[i].type == MathInputType.Operator) {
          expectedState = [
            ExpectedStates.Function,
            ExpectedStates.Operand,
            '('
          ]
        }
        let _o1 = operators.findIndex(e => e.id.toString() == arr[i].value.id);
        let o1 = operators[_o1];
        let o2 = operatorStack[operatorStack.length - 1];
        let _o2 = o2 ? operators.findIndex(e => e.id == o2.id) : -1;
        while (
          _o2 !== -1
          && ((operators[_o1].associativity === "Left"
            && operators[_o1].precedence <= operators[_o2].precedence)
            || (operators[_o1].associativity === "Right"
              && operators[_o1].precedence < operators[_o2].precedence)
          )) {
          const popOperator = operatorStack.pop();
          outputQueue.push({ OperandValue: null, OperatorValue: popOperator.id, Type: CalculateType.OPERATOR, indexs: popOperator.indexs });
          o2 = operatorStack[operatorStack.length - 1];
          _o2 = o2 ? operators.findIndex(e => e.id == o2.id) : -1;
        }
        operatorStack.push({ ...o1, indexs: arr[i].indexs });
      } else if (token === "(") {
        countBrackets++;
        expectedState = [
          ExpectedStates.Function,
          ExpectedStates.Operand,
          '('
        ]
        operatorStack.push({ associativity: null, precedence: null, id: null, name: "(", type: null });
      } else if (token === ")") {
        countBrackets--;
        if (!operatorStack.map(e => e.name).includes('(')) {
          throw this.decorateExpressionErrorMessage(token, arr[i].indexs);
        }
        expectedState = [
          ExpectedStates.Operator,
          ')'
        ]
        while (operatorStack[operatorStack.length - 1].name !== "(") {
          const popOperator = operatorStack.pop();
          outputQueue.push({ OperandValue: null, OperatorValue: popOperator.id, Type: CalculateType.OPERATOR, indexs: popOperator.indexs });
        }
        operatorStack.pop();
        if (operatorStack.length > 0) {
          if (operatorStack[operatorStack.length - 1].type != ECalculatorFunctions_TYPE.OPERATOR) {
            operatorStack[operatorStack.length - 1].indexs = [...operatorStack[operatorStack.length - 1].indexs, ...arr[i].indexs]
          }
        }
      } else {
        expectedState = [
          ExpectedStates.Operator,
          ')'
        ]
        outputQueue.push({ OperandValue: this.praseTokenOperand(arr[i]), OperatorValue: null, Type: CalculateType.OPERAND, indexs: arr[i].indexs });
      }
    }
    while (operatorStack.length > 0) {
      const popOperator = operatorStack.pop();
      outputQueue.push({ OperandValue: null, OperatorValue: popOperator.id, Type: CalculateType.OPERATOR, indexs: popOperator.indexs });
    }
    if (countBrackets > 0) {
      throw createSimpleError(`Missing some ')'`);
    }
    if (countBrackets < 0) {
      throw createSimpleError(`Missing some '('`);
    }
    return outputQueue;
  }

  checkToken(item: MathInputItem, expectedState: any[]) {
    let token = item.type == MathInputType.Boolean ? item.value.display : item.value.value;
    let expectedItemState;
    if (item.type == MathInputType.Function) {
      expectedItemState = ExpectedStates.Function;
    } else if (item.type == MathInputType.Operator) {
      expectedItemState = ExpectedStates.Operator;
    } else {
      if (token == '(') {
        expectedItemState = '(';
      } else if (token == ')') {
        expectedItemState = ')';
      } else {
        expectedItemState = ExpectedStates.Operand
      }
    }

    if (!this.checkExpresstion(expectedState, expectedItemState)) {
      throw this.decorateExpressionErrorMessage(item.value.display, item.indexs);
    }
  }

  checkLastToken(item: MathInputItem) {
    let token = item.type == MathInputType.Boolean ? item.value.display : item.value.value;
    if ((token === "(")) {
      throw this.decorateExpressionErrorMessage(token, item.indexs);
    }
    if (item.type == MathInputType.Function) {
      throw this.decorateExpressionErrorMessage(item, item.indexs);
    }
    if (item.type == MathInputType.Operator) {
      throw this.decorateExpressionErrorMessage(token, item.indexs);
    }
  }

  checkExpresstion(currentExpectedstate: Array<any>, state: any) {
    if (state != undefined) {
      return currentExpectedstate.includes(state);
    }
    return false;
  }

  decorateExpressionErrorMessage(token, indexs: number[]) {
    return createSimpleError(`Unexpected ${token}`, undefined, { indexs: indexs })
  }

  getTypeForField(schema: any, columnName: string): OperandType {
    const field = schema._fieldsByIndex[schema._indicesByKey[columnName]];
    if (!field) {
      return null;
    }
    if (Field.hasFlag(field, DataTypeFlags.Boolean)) {
      return OperandType.boolean;
    }
    if (Field.hasFlag(field, DataTypeFlags.String)) {
      return OperandType.string;
    }
    if (Field.hasFlag(field, DataTypeFlags.Float)) {
      return OperandType.double;
    }
    if (Field.hasFlag(field, DataTypeFlags.Double)) {
      return OperandType.double;
    }
    if (Field.hasFlag(field, DataTypeFlags.Number)) {
      return OperandType.int;
    }
    if (Field.hasFlag(field, DataTypeFlags.DateTime)) {
      return OperandType.datetime;
    }
    throw new Error('Not implemented');
  }

  getFieldAttribute(schema: any, columnName: string): any {
    const field = schema._fieldsByIndex[schema._indicesByKey[columnName]];
    if (!field) {
      return null;
    }
    const attributes = field['Attributes'];
    return attributes
  }

  getReturnTypeByOperandType(operandType: OperandType): ICalculatorFunctionReturnType {
    if (operandType == OperandType.boolean) {
      return ICalculatorFunctionReturnType.boolean;
    }
    if (operandType == OperandType.string) {
      return ICalculatorFunctionReturnType.string;
    }
    if (operandType == OperandType.double || operandType == OperandType.int) {
      return ICalculatorFunctionReturnType.number;
    }
    if (operandType == OperandType.datetime) {
      return ICalculatorFunctionReturnType.datetime;
    }
    throw new Error('Not implemented');
  }

  expectResult(outputQueue: ICalculateObject[], type: ICalculatorFunctionReturnType) {
    let stack: { type: ICalculatorFunctionReturnType, indexs: number[] }[] = []
    for (let index = 0; index < outputQueue.length; index++) {
      const element = outputQueue[index];
      if (element.Type == CalculateType.OPERAND) {
        switch (element.OperandValue.DataType) {
          case OperandType.boolean:
            stack.push({ type: ICalculatorFunctionReturnType.boolean, indexs: element.indexs });
            break;
          case OperandType.string:
            stack.push({ type: ICalculatorFunctionReturnType.string, indexs: element.indexs });
            break;
          case OperandType.double:
          case OperandType.int:
            stack.push({ type: ICalculatorFunctionReturnType.number, indexs: element.indexs });
            break;
          case OperandType.datetime:
            stack.push({ type: ICalculatorFunctionReturnType.datetime, indexs: element.indexs });
            break;
          default:
            throw new Error('Not Implemented');
        }
      } else if (element.Type == CalculateType.OPERATOR) {
        const operator = this.CalculatorFunctions.find(e => e.id == element.OperatorValue);
        if (operator.type == ECalculatorFunctions_TYPE.OPERATOR) {
          let _e1 = stack.pop();
          let _e2 = stack.pop();
          if (operator.id == ECalculatorFunctions.PLUS) {
            if (_e1.type == ICalculatorFunctionReturnType.number && _e2.type == ICalculatorFunctionReturnType.number) {
              stack.push({ type: ICalculatorFunctionReturnType.number, indexs: element.indexs });
            }
            // else if (_e1.type == ICalculatorFunctionReturnType.boolean && _e2.type == ICalculatorFunctionReturnType.boolean) {
            //   stack.push({ type: ICalculatorFunctionReturnType.boolean, indexs: element.indexs });
            // }
            else if ((_e1.type == ICalculatorFunctionReturnType.number && _e2.type == ICalculatorFunctionReturnType.string) ||
              (_e1.type == ICalculatorFunctionReturnType.string && _e2.type == ICalculatorFunctionReturnType.number) ||
              (_e1.type == ICalculatorFunctionReturnType.string && _e2.type == ICalculatorFunctionReturnType.string)) {
              stack.push({ type: ICalculatorFunctionReturnType.string, indexs: element.indexs });
            } else {
              throw createSimpleError(`Your formula is invalid. Only text characters or numbers can be used`, undefined, { indexs: [...element.indexs, ..._e1.indexs, ..._e2.indexs] })
            }
          } else if (_e1.type == ICalculatorFunctionReturnType.number && _e2.type == ICalculatorFunctionReturnType.number) {
            stack.push({ type: ICalculatorFunctionReturnType.number, indexs: element.indexs });
          } else {
            throw createSimpleError(`Your formula is invalid. Only a number can use the ${ECalculatorFunctions[operator.id].toUpperCase()} operator`, undefined, { indexs: [...element.indexs, ..._e1.indexs, ..._e2.indexs] })
          }
        } else {
          let _e = stack.pop();
          if ((operator.input == ICalculatorFunctionReturnType.number && _e.type != ICalculatorFunctionReturnType.number) ||
            (operator.input == ICalculatorFunctionReturnType.string && _e.type != ICalculatorFunctionReturnType.string)) {
            throw createSimpleError(`Your formula is invalid. Please review function ${ICalculatorFunctionReturnType[operator.input].toUpperCase()}`, undefined, { indexs: [...element.indexs, ..._e.indexs] })
          }
          stack.push({ type: operator.output, indexs: element.indexs });
        }
      }
    }
    if (stack[0] && stack[0].type != type) {
      throw createSimpleError(`Your formula is invalid. The column type is ${ICalculatorFunctionReturnType[type].toUpperCase()} but function returns ${ICalculatorFunctionReturnType[stack[0].type].toUpperCase()}`, undefined, {
        indexs: outputQueue.map(e => e.indexs).reduce((a, b) => {
          return [...a, ...b]
        })
      })
    }
  }

}
