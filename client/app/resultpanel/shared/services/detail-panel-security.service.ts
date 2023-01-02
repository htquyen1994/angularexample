import { Injectable } from '@angular/core';
import { HttpService } from '../../../shared'
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { IGroup } from '../models/detail-panel.model';

@Injectable()
export class DetailPanelSecurityService {
  constructor(private httpService: HttpService) { }

  getSecurityData(id: string, isRetailer: boolean, hasPOLTonch: boolean) {
    if (isRetailer) {
      const params = new HttpParams()
        .set('oid', id)
      return this.httpService.get(`Retailer/GetRetailerSecurity`, params).pipe(
        map(e => this.formatSecurityData(e, isRetailer, hasPOLTonch)))
    } else {
      const params = new HttpParams()
        .set('fadCode', id)
      return this.httpService.get(`Branch/GetBranchSecurity`, params).pipe(
        map(e => this.formatSecurityData(e, isRetailer, hasPOLTonch))
      );
    }
  }

  formatSecurityData(data: any = {}, isRetailer: boolean, hasPOLTonch: boolean) {
    const { securityView, securityRiskAssessment, crimeStatistics, calculatedData, totalScore } = data;
    return {
      securityView: isRetailer ?
        this.securityViewRetailer(securityView) :
        this.securityViewBranch(securityView,hasPOLTonch),
      securityStatistics: {
        crimeStatistics: crimeStatistics.map(e => ({ ...e, description: this.formatDescription(e.description) })),
        calculatedData: calculatedData.map(e => ({ ...e, description: this.formatDescription(e.description) })),
        totalScore
      },
      securityRiskAssessment: isRetailer ?
      this.securityRiskAssessmentRetailer(securityRiskAssessment) :
      this.securityRiskAssessmentBranch(securityRiskAssessment)
    }
  }

  securityViewBranch(securityView: any = {}, hasPOLTonch: boolean): IGroup {
    return {
      name: 'Security View',
      details: [{
        name: 'FAD Code',
        value: securityView.fadCode
      },{
        name: 'Name',
        value: securityView.branchName
      },{
        name: 'Postcode',
        value: securityView.postcode
      },{
        name: 'Robbery Risk Category',
        value: securityView.robberyRiskCategory
      },{
        name: 'Burglary Risk Category',
        value: securityView.burlaryRiskCategory
      },{
        name: 'Average TONCH',
        value: hasPOLTonch ? securityView.averageTonch : null,
        format: '£',
        formatPipe: 'currency'
      },{
        name: 'Electronic Security',
        value: securityView.cbreData,
        isArray: true
      },{
        name: 'Safe',
        value: securityView.safe,
        isArray: true
      },{
        name: 'ATM',
        value: securityView.atm
      }]
    }
  }

  securityViewRetailer(securityView:any = {}): IGroup {
    return {
      name: 'Security View',
      details: [{
        name: 'Retailer Name',
        value: securityView.retailerName
      },{
        name: 'Postcode',
        value: securityView.postcode
      },{
        name: 'Provisional Robbery Risk Category',
        value: securityView.provisionalRiskScore
      }]
    }
  }
  securityRiskAssessmentBranch(securityRiskAssessment: any ={}): IGroup{
    return {
      name: 'Security Risk Assessment',
      details: [{
        name:'Alarm Required',
        value: securityRiskAssessment.alarmRequirements
      },{
        name:'TDLC Required',
        value: securityRiskAssessment.tdlcRequirements
      },{
        name:`ATM Conditions
        (Only Applicable to ATM Team)`,
        value: securityRiskAssessment.atmConditions
      },{
        name:'Screenless Acceptable',
        value: securityRiskAssessment.screenless
      },{
        name:'Security Equipment Conditions',
        value: securityRiskAssessment.securityEquipmentConditions
      }]
    }
  }
  securityRiskAssessmentRetailer(securityRiskAssessment: any ={}): IGroup{
    return {
      name: 'Security Risk Assessment',
      details: [{
        name:'Alarm Required',
        value: securityRiskAssessment.alarmRequirements
      },{
        name:'TDLC Required',
        value: securityRiskAssessment.tdlcRequirements
      },{
        name:`Security Equipment Conditions`,
        value: securityRiskAssessment.securityEquipmentConditions
      },{
        name:'Screenless Acceptable',
        value: securityRiskAssessment.screenless
      }]
    }
  }


  formatDescription(str: string) {
    const matches = str.match(/\((.*?)\)/);
    let result = str;
    if (matches) {
      result = str.replace(matches[0], ``);
      result = `${result}
      ${matches[0]}
      `
    }
    return `${result}`;
  }
}
