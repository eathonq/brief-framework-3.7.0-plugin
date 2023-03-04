/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-03-04 12:07
 */

type UpdateData = {
    uuid: string;
    callback: (dt: number) => void;
}

type SecondData = {
    uuid: string;
    /** 是否使用补全缺失的回调（默认为 true）*/
    isComplete: boolean;
    callback: () => void;
}

type IntervalData = {
    uuid: string;
    /** 间隔时间（秒） */
    interval: number;
    /** 重复次数（默认为 0，表示无限循环） */
    repeat: number;
    /** 是否使用补全缺失的回调（默认为 true）*/
    isComplete: boolean;
    callback: () => void;

    _time: number;
}

/** 时间轴类 */
class Timeline {
    private _onUpdateList: UpdateData[] = [];
    private _onSecondList: SecondData[] = [];
    private _onIntervalList: IntervalData[] = [];

    private _isInit: boolean = false;
    /**
     * 初始化时间轴
     * @param schedule 时间轴的调度器（默认使用 setInterval ）
     * @param interval 时间轴的刷新间隔（秒）
     */
    init(schedule?: { schedule: (callback: Function, interval: number) => void; }, interval?: number): void {
        if (this._isInit){
            console.warn(`Timeline has been initialized.`);
        }
        this._isInit = true;

        this._time = Date.now();
        if (schedule) {
            schedule.schedule(this.onTimelineUpdate.bind(this), interval || 1);
        }
        else {
            setInterval(this.onTimelineUpdate.bind(this), (interval || 1) * 1000);
        }
    }

    private _id: number = 0;
    private get uuid(): string {
        return `timer.${++this._id}`;
    }

    /**
     * 设置每帧回调
     * @param callback 回调函数
     * @returns uuid
     */
    setUpdate(callback: (dt: number) => void): string {
        if (!this._isInit) {
            console.error("Timeline is not initialized.");
            return null;
        }

        let uuid = this.uuid;
        this._onUpdateList.push({ uuid, callback });
        return uuid;
    }

    /**
     * 设置每秒回调
     * @param callback 回调函数
     * @param isComplete 是否使用补全缺失的回调（默认为 true）
     * @returns uuid
     */
    setSecond(callback: () => void, isComplete: boolean = true): string {
        if (!this._isInit) {
            console.error("Timeline is not initialized.");
            return null;
        }

        let uuid = this.uuid;
        this._onSecondList.push({ uuid, isComplete, callback });
        return uuid;
    }

    /**
     * 设置间隔回调
     * @param callback 回调函数
     * @param interval 间隔时间（秒）
     * @param repeat 重复次数（默认为 0，表示无限循环）
     * @param isComplete 是否使用补全缺失的回调（默认为 true）
     * @returns uuid
     */
    setInterval(callback: () => void, interval: number, repeat: number = 0, isComplete: boolean = true): string {
        if (!this._isInit) {
            console.error("Timeline is not initialized.");
            return null;
        }

        let uuid = this.uuid;
        this._onIntervalList.push({ uuid, interval, repeat, isComplete, callback, _time: 0 });
        return uuid;
    }

    /**
     * 清理回调
     * @param uuid 回调的 uuid 
     */
    clean(uuid: string): void {
        // 清理 onUpdate 回调
        let index = this._onUpdateList.findIndex((data) => data.uuid == uuid);
        if (index >= 0) {
            this._onUpdateList.splice(index, 1);
        }

        // 清理 onSecond 回调
        index = this._onSecondList.findIndex((data) => data.uuid == uuid);
        if (index >= 0) {
            this._onSecondList.splice(index, 1);
        }

        // 清理 onInterval 回调
        index = this._onIntervalList.findIndex((data) => data.uuid == uuid);
        if (index >= 0) {
            this._onIntervalList.splice(index, 1);
        }
    }

    private _time: number = 0;
    private onTimelineUpdate() {
        let dt = Date.now() - this._time;
        this._time = Date.now();
        this.doAllUpdate(dt / 1000);
    }

    private doAllUpdate(dt: number) {
        // 执行 onUpdate 回调
        for (let i = 0; i < this._onUpdateList.length; i++) {
            this._onUpdateList[i].callback(dt);
        }
        this.doAllSecond(dt);
        this.doAllInterval(dt);
    }

    private _timeSecond: number = 0;
    private doAllSecond(dt: number) {
        this._timeSecond += dt;
        if (this._timeSecond >= 1) {
            let count = Math.floor(this._timeSecond);
            this._timeSecond = 0;

            // 执行 onSecond 回调
            for (let i = 0; i < this._onSecondList.length; i++) {
                let data = this._onSecondList[i];
                if (data.isComplete) {
                    for (let j = 0; j < count; j++) {
                        data.callback();
                    }
                }
                else {
                    data.callback();
                }
            }
        }
    }

    private doAllInterval(dt: number) {
        // 执行 onInterval 回调
        for (let i = this._onIntervalList.length - 1; i >= 0; i--) {
            let data = this._onIntervalList[i];
            data._time += dt;
            if (data._time >= data.interval) {
                let count = Math.floor(data._time / data.interval);
                data._time = 0;

                if (!data.isComplete) count = 1;

                if (data.repeat > 0) {
                    count = Math.min(count, data.repeat);
                    data.repeat -= count;
                    for (let j = 0; j < count; j++) {
                        data.callback();
                    }
                    if (data.repeat <= 0) {
                        this._onIntervalList.splice(i, 1);
                    }
                }
                else {
                    for (let j = 0; j < count; j++) {
                        data.callback();
                    }
                }
            }
        }
    }
}

/** 
 * 时间轴
 * @example
 * // 每帧回调
 * let uuid = timeline.setUpdate((dt) => {});
 * // 每秒回调
 * let uuid = timeline.setSecond(() => {});
 * // 间隔回调
 * let uuid = timeline.setInterval(() => {}, 1);
 * // 清理回调
 * timeline.clean(uuid);
 */
export const timeline = new Timeline();

/**
 * 延迟函数
 * @param time 延迟时间（秒） 
 */
export function delay(time: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, time * 1000);
    });
}