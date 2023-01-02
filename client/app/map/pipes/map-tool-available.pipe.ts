import { Pipe, PipeTransform } from '@angular/core';
import { MapToolType } from '../../shared/enums';
import { MapToolService } from '../../shared/services';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'mapToolAvailable'
})
export class MapToolAvailablePipe implements PipeTransform {

  constructor(private _mapToolService: MapToolService){ }

  static Tools: MapToolType[] = [
    MapToolType.INSIGHTS,
    MapToolType.REPORTS,
    MapToolType.QUICKEDIT,
    MapToolType.ISOGRAM,
    MapToolType.SAVE_LOCATION,
    MapToolType.MEASUREMENT_NEW,
    MapToolType.ROUTE_TOOL,
    MapToolType.CRIME_STATISTIC,
  ]
  transform(tool: MapToolType): Observable<boolean> {
    return this._mapToolService.availableTools$.pipe(
      map(availableTools=> availableTools.includes(tool))
    )
  }
}
