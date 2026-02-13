export default class BlockingQueue {
    constructor() {
        this._items = [];
        this._waiters = [];
        this._emptyPromise = null;
        this._emptyResolve = null;
    }

    enqueue(item, ...restItems) {
        if (restItems.length === 0) {
            this._items.push(item);
        }
        else {
            const items = [item, ...restItems].filter(i => i);
            if (items.length === 0) return;
            this._items.push(...items);
        }

        if (this._emptyResolve) {
            this._emptyResolve();
            this._emptyResolve = null;
            this._emptyPromise = null;
        }

        this._wakeWaiters();
    }

    async dequeue(min = 1, timeout = Infinity, onTimeout = null) {
        if (this._items.length === 0) {
            await this._waitForFirstItem();
        }

        if (this._items.length >= min) {
            return this._flush();
        }

        return new Promise((resolve, reject) => {
            let timer = null;
            const waiter = { resolve, reject, min, onTimeout, timer };

            if (Number.isFinite(timeout)) {
                waiter.timer = setTimeout(() => {
                    this._removeWaiter(waiter);
                    if (onTimeout) onTimeout(this._items.length);
                    resolve(this._flush());
                }, timeout);
            }

            this._waiters.push(waiter);
        });
    }

    _waitForFirstItem() {
        if (!this._emptyPromise) {
            this._emptyPromise = new Promise(r => (this._emptyResolve = r));
        }
        return this._emptyPromise;
    }

    _wakeWaiters() {
        for (let i = this._waiters.length - 1; i >= 0; i--) {
            const w = this._waiters[i];
            if (this._items.length >= w.min) {
                this._removeWaiter(w);
                w.resolve(this._flush());
            }
        }
    }

    _removeWaiter(waiter) {
        const idx = this._waiters.indexOf(waiter);
        if (idx !== -1) {
            this._waiters.splice(idx, 1);
            if (waiter.timer) clearTimeout(waiter.timer);
        }
    }

    _flush() {
        const snapshot = [...this._items];
        this._items.length = 0;
        return snapshot;
    }

    get length() {
        return this._items.length;
    }
}
