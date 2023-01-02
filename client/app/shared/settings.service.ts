import {Injectable} from '@angular/core';
import {HttpService} from './http.service';
import {ReplaySubject, Subscription} from 'rxjs';
import { IStartUpSettings } from './interfaces';

@Injectable()
export class SettingsService {

    startupSettingsStore: IStartUpSettings = null;
    startupSettingsSource = new ReplaySubject<IStartUpSettings>(1);
    startupSettings = this.startupSettingsSource.asObservable();

    constructor(private httpService: HttpService) {
        this.startupSettings.subscribe(startupSettings => {
            this.startupSettingsStore = startupSettings;
        });
    }

    getStartSettings(): Subscription {
        return this.httpService.get('TenantSettings/?settingCollection=uistartsettings&settingName=uistartsettings')
            .subscribe((startupSettings: any) => {
                this.startupSettingsSource.next(this.convertToIStartUpSettings(startupSettings));
            });
    }

    /*
        getStartSettings() {
            this.startupSettingsSource.next({
                activeTab: 2,
                mapTool: "select",
                mapType: "terrain",
                resultPanelState: 0,
                sidePanelState: false,
                version: "v9.0.5",
                insightRadii: [250],
                insightDrivetimes: 1
            });
        }
    */

    private convertToIStartUpSettings(item: any): IStartUpSettings {

        const isDesktop = window.innerWidth >= 1024;

        return {
            resultPanelState: isDesktop ? item.resultPanelState : 0,
            sidePanelState: isDesktop ? item.sidePanelState : true,
            activeTab: item.activeTab,
            mapTool: item.mapTool,
        };
    }
}
