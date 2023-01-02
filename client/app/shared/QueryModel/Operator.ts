
export class Operator {
    Name: string = null;
    Description: string = null;
    Filter: ((lhs: any, rhs: any) => boolean) | ((lhs: any) => boolean) | ((lhs: any[]) => boolean) | ((lhs: any[]) => any);

    constructor(name: string, description: string, filter: ((lhs: any, rhs: any) => boolean) | ((lhs: any) => boolean) | ((lhs: any[]) => boolean) | ((lhs: any[]) => any)) {
        this.Name = name;
        this.Description = description;
        this.Filter = filter;
    }
  

}