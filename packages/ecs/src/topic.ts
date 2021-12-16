export class Topic<T = unknown> {
    private staged: T[] = [];
    private ready: T[] = [];

    public push(event: T): void {
        this.staged.push(event);
    }

    public pushImmediate(event: T): void {
        this.ready.push(event);
    }

    public flush(): void {
        const ready = this.ready;
        const staged = this.staged;

        while (ready.length > 0) {
            ready.pop();
        }
        const length = staged.length;
        let i;

        for (i = length - 1; i >= 0; i--) {
            ready[i] = staged.pop() as T;
        }
    }

    public clear(): void {
        const ready = this.ready;
        const staged = this.staged;

        while (ready.length > 0) {
            ready.pop();
        }
        while (staged.length > 0) {
            staged.pop();
        }
    }

    *[Symbol.iterator](): IterableIterator<T> {
        const count = this.ready.length;
        let i;
        for (i = 0; i < count; i++) {
            yield this.ready[i];
        }
    }
}
