import { Injectable } from '@angular/core';
import { IFunctionalityResponse, IFunctionality, IFunctionalityClaim } from '../interfaces';
import { uniq } from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class FunctionalityLogicService {

  constructor() { }

  decorateData(response: IFunctionalityResponse[]): {data: IFunctionality[], claims: IFunctionalityClaim[]}{
    const data: IFunctionality[] = [];
    const _claims:string[] = []
    response.sort((a,b)=>{
      return b.hasAccess.length - a.hasAccess.length
    }).forEach(e=>{
      const { category, icons, description, name, hasAccess } = e;
      const _hasAccess = {};
      hasAccess.forEach(key=>{
        _hasAccess[key] = true
      });
      data.push({category: category? category : 'Not Grouping', icons, description, name, id: name, hasAccess: _hasAccess});
      _claims.push(...hasAccess);
    })
    const claims: IFunctionalityClaim[] = uniq(_claims).map(e=>({id: e, name: e}));
    return {
      data,
      claims
    }
  }
}
