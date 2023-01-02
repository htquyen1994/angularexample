import { WWMessage } from './models/messages/message';

export abstract class SharedWorkerBase {
  connections: MessagePort[] = [];
  constructor(public workerCtx: any, public shared: boolean = true) {
    // workerCtx as SharedWorkerGlobalScope
    if (shared) {
      this.workerCtx.addEventListener("connect", (event: MessageEvent) => {
        let port = event.ports[0];
        this.connections.push(port);
        port.start();
        port.onmessage = (event) => this.onMessage(event);
      });
    } else {
      this.workerCtx.addEventListener("message", (event: MessageEvent) => {
        this.onMessage(event);
      });
    }
  }

  messageForAll(message: WWMessage) {
    if (this.shared) {
      <SharedWorker>this.workerCtx
      this.connections.forEach((port) => {
        port.postMessage(message);
      })
    } else {
      this.workerCtx.postMessage(message);
    }
  }

  private onMessage(event: MessageEvent) {
    let m: WWMessage = <WWMessage>event.data;
    //cacheworker port
    this.HandleMessage(m);
  }

  abstract HandleMessage(message: WWMessage);

  public close() {
    this.connections.forEach((port) => port.close())
    this.workerCtx.close();
  }
}
