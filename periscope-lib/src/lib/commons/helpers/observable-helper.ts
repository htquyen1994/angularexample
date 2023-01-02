import { Observable, BehaviorSubject } from 'rxjs';

export function createBehaviorSubject<T>(observable: Observable<T>, defaultValue?: T) {
  const behaviorSubject = new BehaviorSubject(defaultValue);

  observable.subscribe(value => behaviorSubject.next(value));

  return behaviorSubject;
}
