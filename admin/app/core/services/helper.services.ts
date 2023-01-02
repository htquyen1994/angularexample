import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { ELicenceExpiresStatus } from '@admin-shared/enums';

@Injectable()
export class HelperService {

  checkLicenceExpiresWarning(tenantLicenceExpires: string): ELicenceExpiresStatus {
    if (!tenantLicenceExpires) return ELicenceExpiresStatus.VALID;
    const currentDate = moment(new Date());
    const tenantLicenceExpiresDate = moment(tenantLicenceExpires);
    const diff = tenantLicenceExpiresDate.diff(currentDate, 'months', true);
    return diff < 3 ? diff < 1 ? ELicenceExpiresStatus.WARNING1M : ELicenceExpiresStatus.WARNING3M : ELicenceExpiresStatus.VALID;
  }
}
