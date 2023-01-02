import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { LocationService } from '../../location.service';
import { ILocation } from '../../interfaces';

@Component({
    selector: 'go-location-form',
    moduleId: module.id,
    templateUrl: 'location-form.component.html',
    styleUrls: ['location-form.component.less'],
    encapsulation: ViewEncapsulation.None
})
export class LocationFormComponent {
    @Input() hasDelete = true;
    @Input() hasCancel = true;

    @Input('location') set _location(value) {
      this.location = value;
      this.cd.detectChanges();
    }
    @Output() onOpen = new EventEmitter<boolean>();
    @Output() onConfirm = new EventEmitter<ILocation>();
    location: ILocation;
    constructor(private locationService: LocationService, private cd: ChangeDetectorRef) {
    }

    deleteLocation(event: Event, location: ILocation) {
        event.stopPropagation();
        this.onOpen.emit(false);

        this.locationService.deleteLocation(location);
    }

    onAction(event: Event, location: ILocation, name: string, isDefault: boolean) {
        const _location: ILocation = {
            ...location,
            name,
            isDefault
        }

        this.onConfirm.emit(_location);
    }

    cancelLocationEdit(event: Event) {
        event.stopPropagation();
        this.onOpen.emit(false);
    }

    onFocusOut(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
    }
    onClick(event, location) {
        this.cd.detectChanges();
    }
}
