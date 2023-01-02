import { Directive, Input } from "@angular/core";
import { NG_VALIDATORS, AbstractControl, Validator } from "@angular/forms";
import { numberWithCommastoNumber } from "../global";

@Directive({
    selector: '[goInputValidator]',
    providers: [{ provide: NG_VALIDATORS, useExisting: InputValidatorDirective, multi: true }]
})
export class InputValidatorDirective implements Validator {
    @Input('validateObj') object: { [key: string]: any };

    validate(control: AbstractControl): { [key: string]: any } | null {
        if (!control.value) {
            return null;
        }
        if (control.value instanceof Object || control.value instanceof Array) {
            console.error('type of value is not supported for validator');
            return null;
        }
        let value = parseFloat(numberWithCommastoNumber(control.value));
        let keys = Object.keys(this.object);
        let error: any = {};
        try {
            keys.forEach(key => {
                let _val = parseFloat(this.object[key]);
                switch (key) {
                    case 'min':
                        this.minValidate(value, _val, error)
                        break;
                    case 'max':
                        this.maxValidate(value, _val, error)
                        break;
                    default:
                        break;
                }
            })
        } catch (error) {
            console.error(error);
            return null;
        }
        return Object.keys(error).length > 0 ? error : null;
    }

    minValidate(value, _val, error) {
        value = numberWithCommastoNumber(value)
        if (value < _val) {
            error['min'] = true;
        }
    }
    maxValidate(value, _val, error) {
        value = numberWithCommastoNumber(value)
        if (value > _val) {
            error['max'] = true;
        }
    }
}