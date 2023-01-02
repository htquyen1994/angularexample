import {ChangeDetectorRef, Component, HostBinding, OnDestroy} from '@angular/core';
import {PanelService} from '../../../shared';

@Component({
    selector: 'go-toolbar',
    moduleId: module.id,
    templateUrl: 'toolbar.component.html',
    styleUrls: ['toolbar.component.less']
})
export class ToolbarComponent {

    constructor() {
    }
}
