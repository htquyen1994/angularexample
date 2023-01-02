import { Pipe, PipeTransform } from '@angular/core';
import { MapToolType } from '../../shared/enums';

@Pipe({
  name: 'mapToolDisabled'
})
export class MapToolDisabledPipe implements PipeTransform {zz
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
  transform(activeTool: MapToolType, ...exceptTools: MapToolType[]): boolean {
    const tools = Object.assign([], MapToolDisabledPipe.Tools)
    if (exceptTools && exceptTools.length) {
      const filter = tools.filter(e=>!exceptTools.includes(e));
      return filter.includes(activeTool);
    }
    return tools.includes(activeTool);;
  }
}
