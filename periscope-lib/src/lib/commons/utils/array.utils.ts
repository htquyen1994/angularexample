import { parse, compareAsc, compareDesc, isValid, parseISO } from 'date-fns';
import { orderBy } from 'lodash'

export enum EDataType {
  STRING = 'string',
  DATE = 'date',
  BOOLEAN = 'boolean'
}

export class ArrayUtils {
  public static sortArrayByDate(arr: Array<any>, type: 'ASC' | 'DESC', dateFormat: string | 'ISO', by: string): Array<any> {
    if(dateFormat === 'ISO'){
      return arr.sort((first, second) => ArrayUtils.sortDateISOFunction(first, second, type, dateFormat, by));
    }
    return arr.sort((first, second) => ArrayUtils.sortDateFunction(first, second, type, dateFormat, by));
  }

  private static sortDateFunction(first, second, type: 'ASC' | 'DESC', dateFormat: string | 'ISO', by: string){
    const firstDate = parse(first[by], dateFormat, 0);
    const secondDate = parse(second[by], dateFormat, 0);
    if (!isValid(secondDate)) {
      return -1;
    }
    if (!isValid(firstDate)) {
      return 1;
    }
    return type === 'ASC' ? compareAsc(firstDate, secondDate) : compareDesc(firstDate, secondDate);
  }

  private static sortDateISOFunction(first, second, type: 'ASC' | 'DESC', dateFormat: string | 'ISO', by: string) {
    const firstDate = parseISO(first[by]);
    const secondDate = parseISO(second[by]);
    if (!isValid(secondDate)) {
      return -1;
    }
    if (!isValid(firstDate)) {
      return 1;
    }
    return type === 'ASC' ? compareAsc(firstDate, secondDate) : compareDesc(firstDate, secondDate);
  }

  public static orderItems(arr: Array<any>, currentIndex: number, expectIndex: number): Array<any> {
    const swapItem = arr[currentIndex];
    let i = currentIndex;

    if (currentIndex < expectIndex) {
      while (i <= expectIndex) {
        arr[i] = { ...arr[i + 1] };

        if (i === expectIndex) {
          arr[i] = { ...swapItem };
        }
        i++;
      }

      return arr;
    }

    while (i >= expectIndex) {
      arr[i] = { ...arr[i - 1] };

      if (i === expectIndex) {
        arr[i] = { ...swapItem };
      }

      i--;
    }

    return arr;
  }

  public static sortData(data: any[], type: 'ASC' | 'DESC', field: string, fieldChild?: string, dataType = EDataType.STRING) {
    return orderBy([...data], (e) => this.getDataField(e, field, fieldChild, dataType), [type.toLowerCase()]);
  }

  private static getDataField(data: any, field: string, fieldChild: string, dataType = EDataType.STRING) {
    const fieldData = fieldChild ? data[field][fieldChild] : data[field];
    if (dataType === EDataType.DATE) {
      return new Date(fieldData).getTime();
    }
    if (dataType === EDataType.BOOLEAN) {
      return !!fieldData;
    }
    return fieldData
  }

  public static replace(
    arr: Array<any>,
    replaceWith: any,
    replaceAt: (replaceItem: any, atItem: any) => boolean
  ): Array<any> {
    return arr.map(it => {
      const atIndex = replaceAt(replaceWith, it);
      return atIndex ? replaceWith : it;
    });
  }

  public static removeItem(arr: Array<any>, predicate: (item: any) => boolean): Array<any> {
    const removeIndex = arr.findIndex(it => predicate(it));

    if (removeIndex >= 0) {
      arr.splice(removeIndex, 1);
    }

    return arr;
  }
}
