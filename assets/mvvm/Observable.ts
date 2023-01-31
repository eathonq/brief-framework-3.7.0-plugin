/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { Locator } from "../common/Locator";
import { decoratorData } from "./MVVM";

//#region 重写数据和通知数据更新
/**
 * ```ts
 * Object.prototype
 * ```
 */
const OP = Object.prototype;
/**
 * object类型
 */
const types = {
    obj: '[object Object]',
    array: '[object Array]'
}
/**
 * 数组方法
 */
const array_funcs = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];

type OverrideObjectCallback = (newVal: any, oldVal: any, pathArray: string[]) => void;
/**
 * 重定义对象
 * 重写对象标记的属性
 */
class OverrideObject {
    /**
     * 构造函数
     * @param obj 目标对象
     * @param callback 数据更新回调
     */
    constructor(obj: any, callback: OverrideObjectCallback) {
        if (OP.toString.call(obj) !== types.obj && OP.toString.call(obj) !== types.array) {
            console.error("请传入一个有效对象或数组。");
        }
        this._callback = callback;
        this.overrideProperty(obj, []);
    }

    private _callback: OverrideObjectCallback;

    /**
     * 重写对象属性
     * @param obj 目标对象
     * @param pathArray 路径数组
     */
    private overrideProperty(obj: any, pathArray: string[]) {
        if (OP.toString.call(obj) === types.array) {
            this.overrideArrayPrototype(obj, pathArray);
        }

        let target = obj.constructor.name;
        Object.keys(obj).forEach((key) => {
            // 检查是否需要重写
            if (!decoratorData.checkProperty(target, key)) return;

            let self = this;
            let oldVal = obj[key];
            let itemPathArray = pathArray.slice();
            itemPathArray.push(key);

            Object.defineProperty(obj, key, {
                get: function () {
                    return oldVal;
                },
                set: function (newVal) {
                    if (oldVal !== newVal) {
                        if (OP.toString.call(newVal) === types.obj) {
                            self.overrideProperty(newVal, itemPathArray);
                        }
                        self._callback(newVal, oldVal, itemPathArray);
                        oldVal = newVal;

                        // 获取通知方法，如果有则调用
                        let notify = decoratorData.getPropertyNotify(target, key);
                        if (notify) {
                            obj[notify]?.();
                        }
                    }
                }
            })

            // 如果是对象或数组，继续重写
            if (OP.toString.call(obj[key]) === types.obj || OP.toString.call(obj[key]) === types.array) {
                this.overrideProperty(obj[key], itemPathArray)
            }

        }, this);
    }

    /**
     * 重写数组原型
     * @param array 目标数组
     * @param pathArray 路径数组
     */
    private overrideArrayPrototype(array: any, pathArray: string[]) {
        // 保存原始 Array 原型  
        var originalProto = Array.prototype;
        // 通过 Object.create 方法创建一个对象，该对象的原型是Array.prototype  
        var overrideProto = Object.create(Array.prototype);
        var self = this;
        var result: any;

        // 遍历要重写的数组方法  
        array_funcs.forEach((method) => {
            Object.defineProperty(overrideProto, method, {
                value: function () {
                    var oldVal = this.slice();
                    //调用原始原型上的方法  
                    result = originalProto[method].apply(this, arguments);
                    //继续监听新数组  
                    self.overrideProperty(this, pathArray);
                    self._callback(this, oldVal, pathArray);
                    return result;
                }
            })
        });
        // 最后让该数组实例的 __proto__ 属性指向 假的原型 overrideProto  
        array['__proto__'] = overrideProto;
    }
}

type TagObjectCallback = (tag: string, newVal: any, oldVal: any, pathArray: string[]) => void;
/**
 * UI设置对象值、获取对象值和通知对象事件
 */
class TagObject {
    constructor(tag: string, obj: any, tagObjectCallback: TagObjectCallback) {
        new OverrideObject(obj, this.callback.bind(this));
        this._tag = tag;
        this.$_obj = obj;
        this._tagObjectCallback = tagObjectCallback;
    }

    private _tag: string;
    get tag() {
        return this._tag;
    }

    private $_obj: any;

    private _tagObjectCallback: TagObjectCallback;

    private callback(newVal: any, oldVal: any, pathArray: string[]) {
        this._tagObjectCallback(this._tag, newVal, oldVal, pathArray);
    }

    setValue(path: string, val: any) {
        let obj = this.$_obj;
        let props = path.split('.');
        for (let i = 0; i < props.length; i++) {
            if (!obj) return;
            const propName = props[i];
            if (propName in obj === false) {
                console.warn('[' + propName + '] not find in ' + this._tag + '.' + path);
                break;
            }
            if (i == props.length - 1) {
                obj[propName] = val;
            } else {
                obj = obj[propName];
            }
        }
    }

    getValue(path: string, def?: any) {
        let obj = this.$_obj;
        let props = path.split('.');
        for (let i = 0; i < props.length; i++) {
            if (!obj) return def;
            const propName = props[i];
            if ((propName in obj === false)) {
                console.warn('[' + propName + '] not find in ' + this._tag + '.' + path);
                return def;
            }
            obj = obj[propName];
        }
        if (obj === null || typeof obj === "undefined") obj = def;
        return obj;
    }

    doCallback(path: string, customEventData?: string) {
        let obj = this.$_obj;
        let props = path.split('.');
        for (let i = 0; i < props.length; i++) {
            if (!obj) return;
            const propName = props[i];
            if (propName in obj === false) {
                console.warn('[' + propName + '] not find in ' + this._tag + '.' + path);
                break;
            }
            if (i == props.length - 1) {
                obj[propName](customEventData);
            } else {
                obj = obj[propName];
            }
        }
    }
}

//#endregion

const OBSERVABLE_BIND_HEAD = '_observable_bind_head_';
/**
 * 绑定回调
 * @param newVal 新值
 * @param oldVal 旧值
 * @param path 绑定路径
 */
export type BindCallback = (newVal: any, oldVal: any, path: string) => void;
/**
 * 数据观察者
 */
export class Observable {

    //#region tag object
    private _object: TagObject = null;

    clean() {
        console.log('clean');
    }

    /**
     * 初始化重定义对象
     * @param tag 标签
     * @param obj 对象
     */
    init(tag: string, obj: any) {
        if (!obj) return;

        this._object = new TagObject(tag, obj, this.internalDataChange.bind(this));
    }

    /**
     * 检测是否存在
     * @param tag 标签
     * @returns 是否存在，true存在，false不存在
     */
    check(tag: string) {
        return this._object && this._object.tag == tag;
    }

    setValue(path: string, value: any) {
        if (!this._object) return;

        path = path.trim();
        let rs = path.split('.');
        if (rs.length < 2) {
            console.warn(`${path} is not a valid path`);
            return;
        }

        this._object.setValue(rs.slice(1).join('.'), value);
    }

    getValue(path: string, def?: any) {
        if (!this._object) return def;

        path = path.trim();
        let rs = path.split('.');
        if (rs.length < 2) {
            console.warn(`${path} is not a valid path`);
            return;
        }

        return this._object.getValue(rs.slice(1).join('.'), def);
    }

    /**
     * 执行UI组件回调
     * @param path 路径
     * @param customEventData 自定义数据 
     * @returns 
     */
    doCallback(path: string, customEventData?: string) {
        if (!this._object) return;

        path = path.trim();
        let rs = path.split('.');
        if (rs.length < 2) {
            console.warn(`${path} is not a valid path`);
            return;
        }

        this._object.doCallback(rs.slice(1).join('.'), customEventData);
    }
    //#endregion

    //#region bind
    bind(path: string, callback: BindCallback, target?: any): void {
        path = path.trim();
        if (path === '') {
            console.warn(`path:${Locator.getNodeFullPath(target.node)} `, '节点绑定的路径为空');
            return;
        }

        this.on(OBSERVABLE_BIND_HEAD + path, callback, target);
    }

    unbind(path: string, callback: BindCallback, target?: any): void {
        path = path.trim();
        if (path === '') {
            console.warn(`path:${Locator.getNodeFullPath(target.node)} `, '节点绑定的路径为空');
            return;
        }

        this.off(OBSERVABLE_BIND_HEAD + path, callback, target);
    }

    onDataChange(path: string, newVal: any, oldVal: any) {
        this.emit(OBSERVABLE_BIND_HEAD + path, newVal, oldVal, path);
    }

    private internalDataChange(tag: string, newVal: any, oldVal: any, pathArray: string[]) {
        let path = `${tag}.${pathArray.join('.')}`;
        this.emit(OBSERVABLE_BIND_HEAD + path, newVal, oldVal, path);
    }
    //#endregion

    //#region event
    private _eventMap: {
        [type: string]: {
            callback: Function,
            target: any
        }[]
    } = {};
    private on(type: string, callback: Function, target: any): void {
        if (!this._eventMap[type]) {
            this._eventMap[type] = [];
        }
        this._eventMap[type].push({ callback, target });
    }

    private off(type: string, callback: Function, target: any): void {
        if (!this._eventMap[type]) return;
        let events = this._eventMap[type];
        for (let i = events.length - 1; i >= 0; i--) {
            if (events[i].callback === callback && (!target || events[i].target === target)) {
                events.splice(i, 1);
            }
        }
        if (events.length === 0) {
            delete this._eventMap[type];
        }
    }

    private emit(type: string, ...args: any[]): void {
        if (!this._eventMap[type]) return;
        let events = this._eventMap[type];
        for (let i = 0; i < events.length; i++) {
            events[i].callback.apply(events[i].target, args);
        }
    }
    //#endregion
}