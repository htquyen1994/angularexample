import { Injectable } from '@angular/core';
import { Observable, fromEvent, ReplaySubject, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map, startWith, debounceTime, tap } from 'rxjs/operators';
import { MAX_MOBILE_WIDTH, Breakpoint, MAX_LAPTOP_WIDTH } from '../global';

interface IScreen {
    width: number,
    height: number
}

@Injectable({
    providedIn: 'root'
})
export class BreakpointService {
    private breakPoint = Breakpoint.DESKTOP;
    readonly change$: Observable<Breakpoint> = fromEvent(window, 'resize').pipe(
        startWith({}),
        map(() => window.innerWidth > MAX_MOBILE_WIDTH ?
            window.innerWidth > MAX_LAPTOP_WIDTH ?
                Breakpoint.DESKTOP : Breakpoint.LAPTOP : Breakpoint.MOBILE),
        distinctUntilChanged(),
        tap(breakPoint => {
            if (this.breakPoint != breakPoint) {
                this.changeBreakPoint(breakPoint);
            }
        })
    );
    private rightSectionChangeSource: ReplaySubject<IScreen> = new ReplaySubject<IScreen>(1);
    readonly rightSection$: Observable<IScreen> = this.rightSectionChangeSource.asObservable().pipe(debounceTime(50), distinctUntilChanged());
    private breakPointChangeSource: BehaviorSubject<Breakpoint> = new BehaviorSubject<Breakpoint>(this.breakPoint);
    readonly breakPoint$: Observable<Breakpoint> = this.breakPointChangeSource.asObservable().pipe(debounceTime(50), distinctUntilChanged());

    changeRightSection(value: IScreen) {
        this.rightSectionChangeSource.next(value);
    }
    changeBreakPoint(value: Breakpoint) {
        this.breakPoint = value;
        this.breakPointChangeSource.next(value);
    }
}
