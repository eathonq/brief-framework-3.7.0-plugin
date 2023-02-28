/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-28 13:49
 */

/**
 * 事件互斥锁，用于限制事件的最大并发量。
 * 例如：限制最大并发量为1，那么当事件正在执行时，后续的事件将会被阻塞，直到事件执行完毕。
 * @example
 * let eventMutex = new EventMutex();
 * // 顺序执行
 * let result = [];
 * for (let i = 0; i < 10; i++) {
 *    await eventMutex.wait();
 *    result.push(i);
 *    eventMutex.notify();
 * }
 */
export class EventMutex {
    /**
     * 构造函数
     * @param maxConcurrency 最大并发量
     */
    constructor(maxConcurrency = 1) {
        this._maxConcurrency = maxConcurrency;   
    }

    private _queue: Function[] = [];
    private _maxConcurrency = 1; // 最大并发量

    /** 等待事件执行 */
    async wait() {
        if (this._maxConcurrency <= 0) {
            await new Promise<void>(resolve => this._queue.push(resolve));
        }
        this._maxConcurrency--
    }
    
    /** 通知事件执行完毕 */
    notify() {
        this._maxConcurrency++;
        this._queue.shift()?.();
    }
}