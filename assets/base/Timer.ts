/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-03-03 14:58
 */

/** 时间轴的调度器接口 */
interface ISchedule {
    schedule: (callback: Function, interval: number) => void;
}

/** 时间轴类 */
class Timeline {
    /** 时间轴的当前时间 */
    private _time: number = 0;

    /** 时间单元列表 */
    private _timerList: Timer[] = [];

    /**
     * 初始化时间轴
     * @param schedule 时间轴的调度器（默认使用 setInterval ）
     * @param interval 时间轴的刷新间隔（秒）
     */
    init(schedule?: ISchedule, interval?: number): void {
        this._time = Date.now();
        if (schedule) {
            schedule.schedule(this.onUpdate.bind(this), interval || 1);
        }
        else {
            setInterval(this.onUpdate.bind(this), (interval || 1) * 1000);
        }
    }

    addTimer(timer: Timer) {
        this._timerList.push(timer);
    }

    removeTimer(timer: Timer) {
        let index = this._timerList.indexOf(timer);
        if (index >= 0) {
            this._timerList.splice(index, 1);
        }
    }

    private onUpdate() {
        let dt = Date.now() - this._time;
        this._time = Date.now();
        this.doTimerUpdate(dt / 1000);
        this.doTimerSecond(dt / 1000);
    }

    private doTimerUpdate(dt: number) {
        for (let i = 0; i < this._timerList.length; i++) {
            this._timerList[i]['doUpdate'](dt);
        }
    }

    private _second: number = 0;
    private doTimerSecond(dt: number) {
        this._second += dt;
        if (this._second >= 1) {
            let count = Math.floor(this._second);
            this._second = 0;
            for (let i = 0; i < this._timerList.length; i++) {
                this._timerList[i]['doSecond'](count);
            }
        }
    }
}

/** 时间轴 */
const timeline = new Timeline();

/**
 * 初始化时间轴
 * @param schedule 时间轴的调度器（默认使用 setInterval ） 
 * @param interval 时间轴的刷新间隔（秒，默认1秒）
 */
export function initTimeline(schedule?: ISchedule, interval?: number) {
    timeline.init(schedule, interval);
}

/** 
 * 时间单元
 * @example
 * let timer = new Timer();
 * timer.onUpdate = (dt) => {}; // 每帧回调函数（根据时间轴的刷新间隔）
 * timer.onSecond = () => {};   // 每秒回调函数
 * timer.onCallback = () => {}; // 回调函数
 * timer.step = 1;              // 回调函数的执行间隔（秒）
 * timer.repeat = 0;            // 回调函数的执行次数（<=0 表示无限次）
 * 
 * timer.start();
 * timer.stop();
 */
export class Timer {
    /**
     * 延时
     * @param time 延时时间（秒）
     */
    static async delay(time: number) {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, time * 1000);
        });
    }

    onUpdate: (dt: number) => void;

    /** 每秒回调函数 */
    onSecond: () => void = null;

    /** 回调函数 */
    onCallback: () => void = null;

    /** 回调函数的执行间隔（秒） */
    step: number = 1;

    /** 回调函数的执行次数（<=0 表示无限次） */
    repeat: number = 0;

    /** 开始 */
    start() {
        this.reset();
        timeline.addTimer(this);
    }

    /** 停止 */
    stop() {
        timeline.removeTimer(this);
    }

    /** 重置 */
    reset() {
        this._time = 0;
        this._repeat = 0;
    }

    /** 当前时间（秒） */
    get currentTime() {
        return this._time;
    }

    /** 当前执行次数 */
    get currentRepeat() {
        return this._repeat;
    }

    private _time: number = 0;
    private _repeat: number = 0;
    private doUpdate(dt: number) {
        this.onUpdate?.(dt);

        this._time += dt;
        if (this._time >= this.step) {
            let count = Math.floor(this._time / this.step);
            this._time = 0;
            if (this.repeat > 0) {
                count = Math.min(count, this.repeat - this._repeat);
                this._repeat += count;
                for (let i = 0; i < count; i++) {
                    this.onCallback?.();
                }
                if (this._repeat >= this.repeat) {
                    this.stop();
                }
            }
            else {
                this._repeat += count;
                for (let i = 0; i < count; i++) {
                    this.onCallback?.();
                }
            }
        }
    }

    private doSecond(count: number) {
        for (let i = 0; i < count; i++) {
            this.onSecond?.();
        }
    }
}