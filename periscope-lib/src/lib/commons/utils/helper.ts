import * as RGBColor from 'rgbcolor';
import { xor } from 'lodash';

export function toHex(hex) {
    if (!hex) return null;
    const color = new RGBColor(hex);
    const rbgcolor = new RGBColor(`rgb(${hex})`);
    if (color.ok) {
        return color.toHex();
    } else if (rbgcolor.ok) {
        return rbgcolor.toHex();
    } else {
        return null;
    }
}

export function string_to_slug(str: string) {
  let _str = str.replace(/^\s+|\s+$/g, '');
  _str = _str.toLowerCase();

  var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  var to = "aaaaeeeeiiiioooouuuunc------";
  for (var i = 0, l = from.length; i < l; i++) {
    _str = _str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
  }

  _str = _str.replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return _str;
}

export function wasChangedData(data: any, data_init: any): boolean {
  if (!data) {
    return false;
  }
  if (!data_init) {
    return true;
  }
  if (Object.keys(data).length) {
    return Object.keys(data).some((key) => {
      return this._isDifference(data[key], data_init[key]);
    });
  } else {
    return this._isDifference(data, data_init);
  }
}

export function wasChangedArray(data: any, dataCompare: any) {
  return xor(data, dataCompare).length > 0;
}

export function _isDifference(a, b): boolean {
  if (a instanceof Array && b instanceof Array) {
    return this.wasChangedArray(a, b);
  } else if (a instanceof Object && b instanceof Object) {
    return this.wasChangedData(a, b);
  }
  return a !== b;
}
