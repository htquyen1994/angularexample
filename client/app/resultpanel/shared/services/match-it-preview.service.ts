import { Injectable } from '@angular/core';
import { HttpService } from '../../../shared/http.service';
import { Observable, Subject, ReplaySubject, of } from 'rxjs';
import { MatchItLayer, MatchItCriteria } from '../models/match-it-filter.model';
import { ReviewModel } from '../models/match-it-review.model';

@Injectable()
export class MatchItPreviewService {

  private reviewDataSource = new ReplaySubject<ReviewModel>(1);
  reviewData = this.reviewDataSource.asObservable();

  private zoomAllSource = new Subject<any>();
  zoomAll = this.zoomAllSource.asObservable().pipe();

  nextReviewData(data: ReviewModel) {
    this.reviewDataSource.next(data);
  }

  onZoomAll() {
    this.zoomAllSource.next(null);
  }
}
