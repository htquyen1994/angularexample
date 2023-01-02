import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {AppInsights} from 'applicationinsights-js';
import {debug} from 'loglevel';

@Injectable({
    providedIn: 'root'
})
export class AppInsightsService {

    private config: Microsoft.ApplicationInsights.IConfig = {
        instrumentationKey: environment.appInsights.instrumentationKey
    };

    constructor() {
        if (!AppInsights.config) {
            AppInsights.downloadAndSetup(this.config);
        }
    }

  logEvent(name: string, properties?: any, value?: any, measurements?: any) {
      const x = {};
      x[properties] = value;
      AppInsights.trackEvent(name, x, measurements);
      debug('[APP-INSIGHTS:EVENT]', name, properties, measurements);
    }
}
