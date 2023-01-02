import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {HttpService} from './http.service';
import { IBatchRequest } from './interfaces';

@Injectable()
export class BatchService {

    batchSource = new Subject<any[]>();
    batch = this.batchSource.asObservable();

    constructor(private httpService: HttpService) {
    }

    runBatchJob(model: IBatchRequest) {
        return this.httpService.postJSON(`Batch/RunJob`, model).subscribe((data: any) => {
            this.batchSource.next(data.status);
        });
    }
}
