import { TemplateRef, Input, Directive, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@Directive({
    selector: '[psTemplate]',
    host: {
    }
})
export class PeriscopeTemplate {
    
    @Input() type: string;
    
    @Input('psTemplate') name: string;
    
    constructor(public template: TemplateRef<any>) {}
    
    getType(): string {
        return this.name;
    }
}

@NgModule({
    imports: [CommonModule],
    exports: [PeriscopeTemplate],
    declarations: [PeriscopeTemplate]
})
export class SharedModule { }