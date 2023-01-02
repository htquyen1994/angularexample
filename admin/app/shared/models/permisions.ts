export interface IClaim {
    id: string,
    name: string,
    value?: boolean
}

// export const ClaimList: IClaim[] = [{
//     id: 'read',
//     name: 'Read'
// }, {
//     id: 'list',
//     name: 'List'
// }, {
//     id: 'modify',
//     name: 'Modify'
// }, {
//     id: 'download',
//     name: 'Download'
// }, {
//     id: 'restricteddownload',
//     name: 'Restricted Download'
// }, {
//     id: 'join',
//     name: 'Join'
// }].slice(0)

export function convertToIClaim(data:string, claimList: IClaim[], value?: boolean): IClaim {
    const claim = claimList.find(e => e.name == data.toLowerCase());
    if(!claim) return null
    return {
        id: claim.id,
        name: claim.name,
        value: value
    }
}