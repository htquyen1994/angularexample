import { MonoTypeOperatorFunction } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export function untilDestroyed<T>(instance: any): MonoTypeOperatorFunction<T> {
  return source$ => source$.pipe(takeUntil(instance.complete$));
}
