export function applyArgs(obj: any, args: any): void {
    if (!(args)) return;
    for (let a in args) {
        if (obj.hasOwnProperty(a)) {
            obj[a] = args[a];
        }
    }
}

export function fixArgs(args?: any, fix?: any): any {
    const a = (args || {});
    const f = (fix || {});
    for (let v in f) {
        a[v] = f[v];
    }
    return a;
}