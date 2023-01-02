import {throwError as observableThrowError, zip as observableZip, ReplaySubject, Observable} from 'rxjs';
import {Injectable} from '@angular/core';

import {HttpService} from './http.service';
import {LayerSource} from './LayerSource';
import { ILocation } from '@client/app/shared/interfaces';
import { switchMap, switchMapTo, tap } from 'rxjs/operators';

@Injectable()
export class LocationService {
    locationStore: ILocation[] = [];
    locationSource = new ReplaySubject<ILocation[]>();
    location = this.locationSource.asObservable();

    constructor(private httpService: HttpService) {
    }

    getLocationList() {
        const source = new ReplaySubject<({ locations: ILocation[] })[]>(1);
        observableZip(
            this.httpService.get('TenantSettings/?settingCollection=locations&settingName=locations'),
            this.httpService.get('UserSettings/?settingCollection=locations&settingName=locations'))
            .subscribe(
                (merged: any) => {
                    source.next(merged);
                },
                error => {
                    return observableThrowError(error);
                });
        return source;
    }

    getLocationListData(merged: any) {

        const mrg: ({ locations: ILocation[] })[] = <({ locations: ILocation[] })[]> merged;

        if (mrg[0].locations) {
            mrg[0].locations.forEach((a: ILocation) => {
                a.source = LayerSource.CORPORATE;
                a.isDefault = false;
            });
        } else {
            mrg[0].locations = [];
        }

        if (mrg[1].locations) {
            mrg[1].locations.forEach((a: ILocation) => {
                a.source = LayerSource.USER;
            });
        } else {
            mrg[1].locations = [];
        }

        const items = {locations: mrg[0].locations.concat(mrg[1].locations)};

        this.locationStore = items.locations.map((item: ILocation, index: number) => {

            item.id = index.toString();
            return item;
        }).sort((a, b) => {
            if (a.isDefault === true) {
                return -1;
            }
            if (a.name.toLowerCase() > b.name.toLowerCase() || b.isDefault === true) {
                return 1;
            }
            if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1;
            }
            return 0;
        });

        this.locationSource.next(this.locationStore);
    }

    updateLocation(location: ILocation) {

        let locations = this.locationStore.slice(0);

        // if (location.coordinates === null)
        //    location.coordinates = this.placesService.getPlace(location.id);

        locations = locations.map(item => {
            if (location.id === item.id) {
                item = location;
            } else if (location.isDefault === true) {
                item.isDefault = false;
            }

            return item;
        });

        this.updateStore(locations);
    }

    addLocation(location: ILocation, zoom: number = 13) {

        location.zoom = zoom;
        location.source = LayerSource.USER;

        let locations = this.locationStore.slice(0);
        locations = locations.map(item => {
            if (location.isDefault) {
                item.isDefault = false;
            }
            return item;
        });

        locations.push(location);

        this.updateStore(locations);
    }

    addLocationObs(location: ILocation, zoom: number = 13) {

      location.zoom = zoom;
      location.source = LayerSource.USER;

      let locations = this.locationStore.slice(0);
      locations = locations.map(item => {
          if (location.isDefault) {
              item.isDefault = false;
          }
          return item;
      });

      locations.push(location);

      return this.updateStoreObs(locations);
  }

    deleteLocation(location: ILocation) {

        if (location.source === LayerSource.CORPORATE) {
            return;
        }

        let locations = this.locationStore.slice(0);

        locations = locations.filter((item) => {
            return item.id !== location.id;
        });

        this.updateStore(locations);
    }

    private updateStore(locations: ILocation[]) {
        return this.httpService.postJSON(
            'UserSettings/?settingCollection=locations&settingName=locations',
            {locations: locations.filter(a => a.source === LayerSource.USER)})
            .subscribe((item: ILocation) => {
                this.getLocationList().subscribe(_ => {
                    this.getLocationListData(_);
                });
            });
    }

  private updateStoreObs(locations: ILocation[]) {
    return this.httpService.postJSON(
      'UserSettings/?settingCollection=locations&settingName=locations',
      { locations: locations.filter(a => a.source === LayerSource.USER) }).pipe(
        switchMap(item => this.getLocationList()),
        tap(_ => this.getLocationListData(_))
      )
  }
}
