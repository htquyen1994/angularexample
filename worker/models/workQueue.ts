import { WWMessage } from './messages/message';

export class WorkQueue {

    private __q: WWMessage[] = [];
    private static __uid: number = 0;
    private static startNumber:number = 0;

    static initId(start: number) {
        WorkQueue.startNumber = start;
        WorkQueue.__uid = start;
    }

    static getNextId(): number {
        if(WorkQueue.checkResetId()){
          WorkQueue.initId(WorkQueue.startNumber);
        }
        return ++WorkQueue.__uid;
    }

    static checkResetId() {
        return WorkQueue.__uid > WorkQueue.startNumber + 5000;
    }

    dequeue(): WWMessage {

        if (this.count == 0)
            return null;

        var retVal: WWMessage = this.__q[0];

        this.__q.splice(0, 1);
        return retVal;
    }

    enqueue(message: WWMessage): void {
        this.__q.push(message);
    }

    get count(): number {
        return this.__q.length;
    }
    clear() {
        this.__q = [];
    }

    removeClientProcessId(clientProcessId: number){
      const index = this.__q.findIndex(e=>e.clientProcessId === clientProcessId);
      if(index != -1){
        this.__q.splice(index, 1);
      }
    }
}
