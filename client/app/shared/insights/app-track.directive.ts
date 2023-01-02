import {Directive, HostListener} from '@angular/core';
import {AppInsightsService} from './app-insights.service';
import {Input} from '@angular/core';

@Directive({
    selector: '[appTrack]'
})
export class AppTrackDirective {

    @Input() appTrackName;
    @Input() appTrackValue;

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        this.applicationInsightsService.logEvent(this.appTrackName, this.appTrackValue);
    }

    constructor(private applicationInsightsService: AppInsightsService) {
    }
}
