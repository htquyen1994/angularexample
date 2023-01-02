import * as moment from 'moment'

export class TYPE {

    static text = new TYPE('text', (a) => (String(a).toLowerCase()));
    static string = new TYPE('string', (a) => (String(a).toLowerCase()));
    static number = new TYPE('number', (a) => (Number(a)));
    static boolean = new TYPE('boolean', (a) => (Boolean(a)));
    static shape = new TYPE('shape', (a) => a);
    static uniqueidentifier = new TYPE('uniqueidentifier', (a) => (a));
    static datetime = new TYPE('datetime', (a) => (moment(a).format('YYYY-MM-DD[T]HH:mm:ss')));
    static unknown = new TYPE('unknown', a => a);

    Name: string;
    Converter: (arg: any) => any;

    constructor(name: string, converter: (arg: any) => any) {
        this.Name = name;
        this.Converter = converter;
    }

}
