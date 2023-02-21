/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

/**
 * 事件数据
 */
interface IEventData {
    callback: Function;
    target: any;
    once: boolean;
}

/**
 * 事件映射
 */
interface IEventMap {
    [type: string]: IEventData[];
}

const _events = new WeakMap();

/** 
 * 游戏事件
 */
class GameEvent {
    constructor() {
        _events.set(this, {})
    }

    /**
     * 注册事件
     * @param type 事件类型 
     * @param callback 事件回调
     * @param target 事件目标
     * @param once 是否只执行一次
     */
    public on(type: string, callback: Function, target?: any, once = false) {
        let events: IEventMap = _events.get(this)

        if (!events) {
            events = {}
            _events.set(this, events)
        }

        if (!events[type]) {
            events[type] = [];
        }

        events[type].push({ callback, target, once })
    }

    /**
     * 注册事件
     * @param type 事件类型
     * @param callback 事件回调
     * @param target 事件目标
     */
    public once(type: string, callback: Function, target?: any) {
        this.on(type, callback, target, true);
    }

    /**
     * 移除事件
     * @param type 事件类型
     * @param callback 事件回调
     * @param target 事件目标
     */
    public off(type: string, callback: Function, target?: any) {
        const events: IEventMap = _events.get(this)
        if (events) {
            if(!events[type]) return;
            let listeners = events[type];
            for (let i = listeners.length - 1; i >= 0; i--) {
                if (listeners[i].callback === callback && (!target || target === listeners[i].target)) {
                    listeners.splice(i, 1);
                }
            }
            if (listeners.length === 0) {
                delete events[type];
            }
        }
    }

    /**
     * 触发事件
     * @param type 事件类型
     * @param args 事件参数
     */
    public emit(type: string, ...args: any) {
        const events: IEventMap = _events.get(this)
        if (events) {
            if (!events[type]) return;
            let listeners = events[type];
            for (let i = listeners.length - 1; i >= 0; i--) {
                const event = listeners[i];
                event.callback.apply(event.target, args);
                if (event.once) {
                    listeners.splice(i, 1);
                }
            }
        }
    }
}

/**
 * 游戏事件
 * @info cocos 自带 EventTarget ，建议优先使用 cocos 的 EventTarget
 * @example
 * gameEvent.on(GameEvent.EVENT_NAME, this.callback, this);
 * gameEvent.emit(GameEvent.EVENT_NAME, arg1, arg2, arg3);
 * gameEvent.off(GameEvent.EVENT_NAME, this.callback, this);
 */
export const gameEvent = new GameEvent();

// import { EventTarget } from 'cc';
// /**
//  * cocos 事件
//  * @url https://docs.cocos.com/creator/manual/zh/engine/event/event-emit.html?h=event
//  * @example
//  * eventTarget.on(GameEvent.EVENT_NAME, this.callback, this);
//  */
// export const eventTarget = new EventTarget();