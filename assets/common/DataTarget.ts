/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-24 11:25
 */

/** 
 * 绑定数据
 */
type BindData = {
    /**
     * 绑定对象
     */
    target: any,
    /**
     * 绑定属性
     */
    attr: string,
    /**
     * 是否允许执行get
     */
    isGet?: boolean,
    /**
     * 是否允许执行set
     */
    isSet?: boolean
};

/** 数据目标 */
export class DataTarget {
    // 索引签名，可以使用额外的属性
    [key: string]: any;

    /**
     * 内部属性标记数组
     */
    private _internal: string[] = ["_internal", "on", "off"];

    /**
     * 绑定数据
     * @param key 数据key 
     * @param bind bind数据, 可以是函数或者对象
     */
    on(key: string, bind: Function | BindData) {
        // 内部属性不允许绑定
        if (this._internal.indexOf(key) !== -1) {
            throw new Error("internal key");
        }

        if (this[key] !== undefined) {
            throw new Error("key is exist");
        }

        if (typeof bind === 'function') {
            this[key] = bind;
            // 重写 get set
            Object.defineProperty(this, key, {
                get: function () {
                    return bind;
                },
                set: function (newValue) {
                    // 不做处理
                    return;
                },
                enumerable: true,
                configurable: true
            });
        }
        else {
            this[key] = bind.target[bind.attr];
            // 重写 get set
            Object.defineProperty(this, key, {
                get: function () {
                    if (bind.isGet === false) return null;
                    return bind.target[bind.attr];
                },
                set: function (newValue) {
                    if (bind.isSet === false) return;
                    bind.target[bind.attr] = newValue;
                },
                enumerable: true,
                configurable: true
            });
        }
    }

    /**
     * 解除绑定
     * @param key 数据key 
     */
    off(key: string) {
        // 内部属性不允许解除绑定
        if (this._internal.indexOf(key) !== -1) {
            throw new Error("internal key");
        }

        if (this[key] === undefined) {
            throw new Error("key is not exist");
        }

        delete this[key];
    }
}