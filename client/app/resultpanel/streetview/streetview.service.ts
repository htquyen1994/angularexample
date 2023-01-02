import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable()
export class StreetviewService {
    private viewSource = new Subject<boolean>();
    view = this.viewSource.asObservable();

    private locateSource = new Subject<any>();
    locate = this.locateSource.asObservable();

    updateLocation(value: boolean) {
        this.viewSource.next(value);
    }

    setShapeLocation(data) {
        this.locateSource.next(data);
    }
}
