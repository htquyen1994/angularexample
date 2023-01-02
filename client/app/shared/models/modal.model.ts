export interface ModalModel{
    title: string;
    content?: string;
    innerHtml?: string;
}

export interface DynamicModalModel extends ModalModel{
  yesButton: string;
  noButton: string;
}

export enum ResultStatus {
    OK,
    CANCEL
}
