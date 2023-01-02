import { Observable, Subscriber, Observer, BehaviorSubject, Subject } from 'rxjs';

import { AvlTree } from './tree-utils/AvlTree';
import { first, share, takeWhile, filter } from 'rxjs/operators';

class CachedItem {
    Key: string;
    Value: any;
    AccessCount: number;
    LastAccess: number;

    constructor(value: any) {
        this.Value = value;
        this.AccessCount = 1;
        this.LastAccess = Date.now();

    }
}

interface SortItem {
    lastAccess: number;
    accessCount: number;
    key: string;
}

export class ClientCache {
    private _backingStore = new AvlTree();

    get itemCount() {
        return this._backingStore.size;
    }

    retrieve<T>(cacheKey: string, factory: () => Observable<T>): Observable<T> {

        let container = this._backingStore.find(cacheKey, this._backingStore.root) as CachedItem;

        if ((container && container.Value && !container.Value.hasError && container.Value.getValue())) {
            container.AccessCount++;
            container.LastAccess = Date.now();
            return container.Value.pipe(filter(e => e != null), first()) as Observable<T>;
        }
        const item$ = new BehaviorSubject<T>(null);
        factory().subscribe(e => item$.next(e), err => item$.error(err), ()=> !item$.getValue() ? item$.error("Empty Value") : null);
        const _container = new CachedItem(item$);
        if (container) {
            container.Value = _container.Value;
        } else {
            this._backingStore.insert(cacheKey, _container);
        }

        return _container.Value.pipe(filter(e => e != null), first());
    }

    insert(cacheKey: string, container: CachedItem) {
        this._backingStore.insert(cacheKey, container);
    }

    deleteKeys(cacheKeys: string | string[]): void {
        if (!Array.isArray(cacheKeys)) {
            cacheKeys = [<string>cacheKeys];
        }

        (<string[]>cacheKeys).forEach(a => this._backingStore.remove(a));
    }

    containsKey(cacheKey: string) {
        return this._backingStore.contains(cacheKey, this._backingStore.root);
    }

    visitKeys(fn: (a: string) => void): void {
        this._backingStore.traverse(this._backingStore.root, (a) => fn(<string>a.key));
    }

    retrieveDirect<T>(cacheKey: string): T {
        const val = <CachedItem>this._backingStore.find(cacheKey, this._backingStore.root);
        if (!(val)) {
            return null;
        }
        return val.Value;
    }

    clean(numberToKeep: number): void {

        if (this._backingStore.size < numberToKeep) {
            return;
        }

        const items: SortItem[] = [];

        this._backingStore.inOrder().forEach((a: any) => {
            items.push({

                lastAccess: (<CachedItem>a.value).LastAccess,
                accessCount: (<CachedItem>a.value).AccessCount,
                key: (<CachedItem>a.value).Key
            });
        });

        // Array.sort(items, this.cacheCleanSorter);
        items.sort(this.cacheCleanSorter);
        for (let i = numberToKeep - 1; i < items.length; i++) {
            this._backingStore.remove(items[i].key);
        }

    }

    clear(): void {
        delete this._backingStore;
        this._backingStore = new AvlTree<string, CachedItem>();
    }

    getDataCacheInOrder() {
        return this._backingStore.inOrder();
    }

    private cacheCleanSorter(a: SortItem, b: SortItem): number {

        const c1 = a.accessCount - b.accessCount;

        return (c1 === 0 ? a.lastAccess - b.lastAccess : c1) * -1; // sort large to small

    }
}
