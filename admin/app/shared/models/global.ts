export const API_BASE_HREF = `${location.pathname}`;
export const MAX_MOBILE_WIDTH = 800;
export const PAGE_SIZE = 25;
export enum Breakpoint {
    DESKTOP,
    MOBILE
}

export function range(min, max){
    const vals = [];
    let val = min;
    while (val <= max){
        vals.push(val);
        val++;
    }
    return [...vals]
}

export function getEmptyGuid() {
  return "00000000-0000-0000-0000-000000000000"
}
