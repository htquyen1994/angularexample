export class Segment {
  _start: any;
  _end: any;
  _length: any;
  _lengthText: any;

  constructor(start, end, length, lengthText) {
    this._start = start;
    this._end = end;
    this._length = length;
    this._lengthText = lengthText
  }

  toJSON() {
    return {
      "start_location": {
        "lat": this._start[1],
        "lng": this._start[0]
      },
      "end_location": {
        "lat": this._end[1],
        "lng": this._end[0]
      },
      "length": {
        "text": this._lengthText,
        "value": this._length
      }
    }
  }

}