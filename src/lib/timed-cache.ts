export class TimedCache<T> {
    #value: T | undefined = undefined;
    #updatedAt: DOMHighResTimeStamp = 0;
    #ttlMs: number;

    constructor(ttlMs: number) {
        this.#ttlMs = ttlMs;
    }

    put(t: T) {
        this.#value = t;
        this.#updatedAt = performance.now();
    }

    get(): T | undefined {
        if (this.#value === undefined) return undefined;
        if (performance.now() - this.#updatedAt > this.#ttlMs) {
            this.#value = undefined;
        }
        return this.#value;
    }
}
