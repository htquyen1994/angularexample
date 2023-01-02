import {Injectable} from '@angular/core';
import {Observable, fromEvent} from 'rxjs';
import {distinctUntilChanged, map, startWith} from 'rxjs/operators';
import { MAX_MOBILE_WIDTH, Breakpoint } from '../../shared/models/global';

@Injectable()
export class BreakpointService {
    readonly change$: Observable<Breakpoint> = fromEvent(window, 'resize').pipe(
        startWith({}),
        map(() => window.innerWidth > MAX_MOBILE_WIDTH ? Breakpoint.DESKTOP : Breakpoint.MOBILE),
        distinctUntilChanged()
    );
}
