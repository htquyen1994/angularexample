import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Injectable()
export class PanelService {

    sidePanelWidth = '300px';
    sidePanelValue: boolean;
    sidePanelSource = new Subject<boolean>();
    sidePanel = this.sidePanelSource.asObservable();

    changeDetectionSource = new Subject<number>();
    changeDetection = this.changeDetectionSource.asObservable().pipe(debounceTime(200));

    setSidePanel(state: boolean) {
        this.sidePanelValue = state;
        this.sidePanelSource.next(state);
    }

    detechChange(){
        this.changeDetectionSource.next();
    }
}
