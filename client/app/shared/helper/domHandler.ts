import { DomHandler } from 'primeng/dom';

export function invokeElementMethod(el, eventname){
  DomHandler.invokeElementMethod(el, eventname);
}
export function find(el, selector){
  return DomHandler.findSingle(el, selector);
}
