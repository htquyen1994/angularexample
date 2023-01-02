import { Injectable } from '@angular/core';
import { Subject, Subscription, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { IHubMessage } from './interfaces';
import { HubMessageType } from './enums';
import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr'
import { SystemBreakdownService } from './services/system-breakdown.service';

@Injectable()
export class HubService {

  connecting$ = new BehaviorSubject<boolean>(false);

  hubSource = new Subject<IHubMessage>();
  hub = this.hubSource.asObservable();

  clientSource = new Subject<IHubMessage>();
  client = this.clientSource.asObservable();
  clientSubscription: Subscription;

  retryConnectionAwaits = [0,2000,10000,30000,60000,60000,60000];
  retryCount= 0;
  //private hubConnection = (<any>$.connection).broadcastHub;
  private connection: HubConnection;

  constructor(
    private systemBreakdownService: SystemBreakdownService
  ) {
    this.connection = new HubConnectionBuilder()
      .withUrl("/signalr/hubs")
      .configureLogging(LogLevel.Information)
      .build();

    this.connection.on('BroadcastTenant', (component: string, content: any) => {

      if (typeof content !== 'object') {
        content = JSON.parse(<any>content);
      }

      this.hubSource.next({
        component,
        content
      });

      if (!environment.production) {
        console.log('SERVER:EVENT', { component, content });
      }
    });

    this.connection.on('BroadcastIndividual', (component: string, content: any) => {

      if (typeof content !== 'object') {
        content = JSON.parse(<any>content);
      }

      this.hubSource.next({
        component,
        content
      });

      if (!environment.production) {
        console.log('SERVER:EVENT', { component, content });
      }
    });

    this.connection.on('BroadcastGlobal', (component: string, content: any) => {

      if (typeof content !== 'object') {
        content = JSON.parse(<any>content);
      }

      this.hubSource.next({
        component,
        content
      });

      if (!environment.production) {
        console.log('SERVER:EVENT', { component, content });
      }
    });

    this.connection.onclose(() => {
      this.start();
    });

    this.start();
  }

  sendMessage(message: IHubMessage) {
    this.clientSource.next(message);
  }

  public async start() {
    try{
      await this.connection.start().then(() => {
        this.clientSubscription = this.client.subscribe((message: IHubMessage) => {
          switch (message.type) {
            case HubMessageType.GLOBAL:
              this.connection.invoke("broadcastGlobal", message.component, message.content)
              break;
            case HubMessageType.TENANT:
              this.connection.invoke("broadcastTenant", message.component, message.content);
              break;
            case HubMessageType.COMMAND:
              this.connection.invoke("command", message.content);
              break;
            case HubMessageType.PING:
              this.connection.invoke("ping", message.content);
              break;
            default:
              console.warn('Not Implemented HubMessageType', message.type);
          }
        });
        this.connecting(true);
        this.retryCount = 0;
      });
    }
    catch(e){
      this.retryCount++;

      if (e && e.statusCode && e.statusCode === 401) {
        console.error('Unauthorize');
        this.systemBreakdownService.reloadBrowser();
        return;
      }

      if(this.retryCount > this.retryConnectionAwaits.length){
        this.systemBreakdownService.reloadBrowser();
        return;
      }

      this.connecting(false);
      console.error('Fail to connect signalR');

      if (this.clientSubscription) {
        this.clientSubscription.unsubscribe();
      }

      setTimeout(() => this.start(), this.retryConnectionAwaits[this.retryCount -1]);
    }
  }

  public disconnect() {
    this.connecting(false);
    this.connection.stop();
  }
  public connecting(value) {
    if (value != this.connecting$.value) {
      this.connecting$.next(value);
    }
  }
}
