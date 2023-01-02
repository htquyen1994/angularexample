import { Component, OnInit, forwardRef, Input, ViewChild, ElementRef, Renderer2, ChangeDetectorRef, Output, EventEmitter, NgZone } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MathInput, MathInputType, MathInputItem, getMathInputItemNull, CalculatorTab } from '@client/app/shared/interfaces';
import { MathInputService } from '@client/app/shared/services';
import { IListItem } from '@client/app/shared/models/order-list.model';
import { IErrorResponse } from '@client/app/shared/http.util';

@Component({
  selector: 'go-math-input',
  templateUrl: './math-input.component.html',
  styleUrls: ['./math-input.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MathInputComponent),
      multi: true
    }
  ],
  host: {
    '(document:click)': 'onClick($event)',
    '(document:keydown)': 'onKeydown($event)'
  },
})
export class MathInputComponent implements ControlValueAccessor, OnInit {
  @Input() disabled = false;
  @Input() error: IErrorResponse;
  @Input() listFunctions: IListItem[] = [];
  @Input() listOperatorFunctions: IListItem[] = [];
  @Input() listColumns: IListItem[] = [];
  @Output() search = new EventEmitter<{ tab: CalculatorTab, searchString: string, isFirst: boolean }>();
  @ViewChild('mathInput') mathInput: ElementRef;
  @ViewChild('inputWrapper', { static: true }) inputWrapper: ElementRef;
  model: MathInput;
  MathInputType = MathInputType
  intervalCursor: any;
  cursor: any;
  indexCursor: number;
  funcionText: string = null;
  string: string = null;
  columnText: string = null;
  isOpenedHelperInput = false;
  onChange = (value: any) => { };
  onTouched = () => { };
  constructor(private renderer: Renderer2,
    public eRef: ElementRef,
    private mathInputService: MathInputService,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone) {
    this.model = {
      outputs: [],
      text: ''
    };
  }

  onClick(event: MouseEvent) {
    if (this.mathInput.nativeElement.contains(event.target)) {
      this.addCursor();
      this.handleEscKey();
      const index = (event.target as any).getAttribute('data-index');
      if (index != null) {
        if (event.offsetX < (event.target['offsetWidth'] / 2)) {
          this.moveCursortoIndex(index)
        } else {
          this.moveCursortoIndex(parseInt(index) + 1)
        }
      } else {
        this.moveCursortoIndex(this.model.outputs.length)
      }
    } else {
      this.removeCursor();
    }
  }

  onKeydown(event: KeyboardEvent) {
    const code = event.code;
    const keycode = event.keyCode;
    const key = event.key;
    if (this.cursor) {
      event.stopImmediatePropagation();
      if (code == 'Backslash' || key == '\\') { // keycode: \
        this.funcionText = '';
        this.onSearch(true);
        this.onOpenHelperInput();
      } else if (code == 'Quote' || key == `'`) { // keycode == '
        this.string = '';
        this.onOpenHelperInput();
      } else if (key == 'BracketLeft' || key == '[') { // keycode == [
        this.columnText = '';
        this.onSearch(true);
        this.onOpenHelperInput();
      } else if (keycode == 37 || keycode == 39) { // arrow keys [L] [R]
        if (this.funcionText == null && this.string == null) {
          this.moveCursor(keycode == 37)
        }
      } else if (keycode == 8 || keycode == 46 ) { // backspace & delete key
        if (this.funcionText == null && this.string == null && this.columnText == null) {
          this.removeElement(keycode == 8);
        } else {
          if (this.funcionText != null) {
            this.funcionText = this.removeCharString(this.funcionText);
            this.onSearch();
          } else if (this.string != null) {
            this.string = this.removeCharString(this.string);
          } else if (this.columnText != null) {
            this.columnText = this.removeCharString(this.columnText);
            this.onSearch();
          }
        }
      } else if ((keycode > 64 && keycode < 91)) { // letter keys
        this.addItem({
          type: MathInputType.Keyword,
          value: { id: null, value: event.key, display: event.key }
        })
      } else if ((keycode > 185 && keycode < 193) // ;=,-./`
        || (keycode > 95 && keycode < 112) // numpad keys
        || (keycode > 47 && keycode < 58)) { // number key'
        const func = this.listOperatorFunctions.find(e => e.name.toLowerCase() == key.toLowerCase());
        if (func) {
          this.addItem({
            type: MathInputType.Operator,
            value: { id: func.id, value: func.name, display: func.name }
          })
        } else {
          this.addItem({
            type: MathInputType.Keyword,
            value: { id: null, value: event.key, display: event.key }
          })
        }
      }
    } else if (this.string != null || this.columnText != null || this.funcionText != null) {
      event.stopImmediatePropagation();
      if (keycode == 27) { // key ESC
        this.handleEscKey();
        this.addCursor();
        this.onSearch();
      } else if (keycode == 13) { // key Enter
        this.addCursor();
        this.moveCursortoIndex(this.indexCursor + 1);
        if (this.addItemFromAdditionTextbox()) {
          this.onCloseHelperInput();
        }
      }
    }
  }
  ngOnInit() {
    this.mathInputService.select.subscribe(item => {
      this.addItem(item)
    })
  }
  writeValue(value: MathInput): void {
    value = {
      ...value,
      text: value.outputs.map(e => e.value.value).join('')
    }
    this.onChange(value);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  addCursor() {
    if (!this.cursor) {
      this.cursor = this.createCursor();
    }
  }
  removeCursor() {
    if (this.intervalCursor) {
      clearInterval(this.intervalCursor)
    }
    if (this.cursor) {
      const element = this.cursor.previousElementSibling;
      const index = element ? element.getAttribute('data-index') : -1;
      this.indexCursor = parseInt(index);
      this.renderer.removeChild(this.mathInput.nativeElement, this.cursor);
      this.cursor = null;
    }
  }
  createCursor() {
    if (this.intervalCursor) {
      clearInterval(this.intervalCursor)
    }
    const span = this.renderer.createElement('span');
    this.renderer.addClass(span, 'math-input-cursor');
    this.intervalCursor = setInterval(() => {
      const hasClass = span.classList.contains('math-input-blink');
      if (hasClass) {
        this.renderer.removeClass(span, 'math-input-blink');
      } else {
        this.renderer.addClass(span, 'math-input-blink');
      }
    }, 800)
    this.renderer.appendChild(this.mathInput.nativeElement, span);
    return span
  }
  moveCursor(left) {
    const element = left ? this.cursor.previousElementSibling : this.cursor.nextElementSibling;
    if (element) {
      const hasClass = this.cursor.classList.contains('math-input-blink');
      if (hasClass) {
        this.renderer.removeClass(this.cursor, 'math-input-blink');
      }
      if (left) {
        this.renderer.insertBefore(this.mathInput.nativeElement, this.cursor, element);
      } else {
        this.renderer.insertBefore(this.mathInput.nativeElement, element, this.cursor);
      }
    }
  }
  moveCursortoIndex(index) {
    const element = this.mathInput.nativeElement.querySelector(`[data-index='${index}']`)
    if (element) {
      this.renderer.insertBefore(this.mathInput.nativeElement, this.cursor, element);
    } else {
      this.renderer.removeChild(this.mathInput.nativeElement, this.cursor);
      this.renderer.appendChild(this.mathInput.nativeElement, this.cursor);
    }
  }
  removeElement(left) {
    const element = left ? this.cursor.previousElementSibling : this.cursor.nextElementSibling;
    if (!element) {
      return
    }
    const index = element.getAttribute('data-index');
    if (index) {
      this.removeItemToOutputs(index);
    }
  }
  removeCharString(str: string) {
    str = str.slice(0, -1);
    return str
  }
  addItem(item: MathInputItem) {
    if (this.cursor) {
      const element = this.cursor.nextElementSibling;
      const index = element ? element.getAttribute('data-index') : this.model.outputs.length;
      if (item.type == MathInputType.Function) {
        this.addItemToOutputs(index, {
          ...item,
          value: {
            ...item.value,
            value: item.value.value,
            display: item.value.value + '('
          }
        });
        this.addItemToOutputs(parseInt(index) + 1, { type: MathInputType.Keyword, value: { id: null, value: ')', display: ')' } });
      } else if (item.type == MathInputType.Column) {
        this.addItemToOutputs(index, {
          ...item,
          value: {
            ...item.value,
            value: item.value.value,
            display: '[' + item.value.value + ']'
          }
        });
      } else if (item.type == MathInputType.String) {
        this.addItemToOutputs(index, {
          ...item,
          value: {
            ...item.value,
            value: item.value.value,
            display: "'" + item.value.display + "'"
          }
        });
      } else {
        this.addItemToOutputs(index, item);
      }
      this.changeDetectorRef.detectChanges();
      this.moveCursortoIndex(parseInt(index) + 1)
    } else {
      this.addCursor();
      this.addItem(item);
    }
  }
  removeItemToOutputs(index) {
    this.model.outputs.splice(index, 1);
    this.writeValue(this.model);
  }
  addItemToOutputs(index, item: MathInputItem) {
    this.model.outputs.splice(index, 0, item);
    this.writeValue(this.model);
  }

  onChangeInput(value: string) {
    if (this.string != null) {
      this.string = value;
    } else if (this.funcionText != null) {
      this.funcionText = value;
      this.onSearch();
    } else if (this.columnText != null) {
      this.columnText = value;
      this.onSearch();
    } else {
      return false;
    }
    return true;
  }

  addItemFromAdditionTextbox() {
    if (this.string != null) {
      if (this.string != '') {
        this.addItem({
          type: MathInputType.String,
          value: { id: null, value: this.string, display: this.string }
        })
      }else {
        this.addItem(getMathInputItemNull());
      }
      this.string = null;
    } else if (this.funcionText != null) {
      const func = this.listFunctions.find(e => e.name.toLowerCase() == this.funcionText.trim().toLowerCase());
      if (func) {
        this.addItem({
          type: MathInputType.Function,
          value: { id: func.id, value: func.name, display: func.name }
        })
      }
      this.funcionText = null;
      this.onSearch();
    } else if (this.columnText != null) {
      const column = this.listColumns.find(e => e.name.toLowerCase() == this.columnText.toLowerCase());
      if (column) {
        this.addItem({
          type: MathInputType.Column,
          value: { id: column.id, value: column.name, display: '[' + column.name + ']' }
        })
      }
      this.columnText = null;
      this.onSearch();
    } else {
      return false;
    }
    return true;
  }

  onSearch(isFirst?: boolean) {
    if (this.funcionText != null) {
      this.search.next({ tab: CalculatorTab.Function, searchString: this.funcionText, isFirst: !!isFirst })
    } else if (this.columnText != null) {
      this.search.next({ tab: CalculatorTab.Columns, searchString: this.columnText, isFirst: !!isFirst })
    } else {
      this.search.next(null)
    }
  }
  onOpenHelperInput() {
    this.isOpenedHelperInput = true;
    this.removeCursor();
    this.changeDetectorRef.detectChanges();
    setTimeout(() => {
      const input = this.inputWrapper.nativeElement.querySelector(`input:first-child`);
      if (input) {
        input.focus();
      }
    }, 0);
  }
  onCloseHelperInput() {
    this.isOpenedHelperInput = false;
  }

  handleEscKey() {
    this.funcionText = null;
    this.columnText = null;
    this.string = null;
    this.onCloseHelperInput();
  }
}
