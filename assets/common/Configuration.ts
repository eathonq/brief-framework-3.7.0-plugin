/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-03 14:58
 */

import { sys } from "cc";

/** 本地存储接口 */
export interface IStorage {
    /**
     * 获取本地存储数据
     * @param key 配置键 
     * @param def 默认值
     * @returns 配置值
     */
    getItem(key: string, def?: any): any;

    /**
     * 设置本地存储数据
     * @param key 配置键 
     * @param data 配置值
     */
    setItem(key: string, data: any): void;

    /**
     * 删除本地存储数据
     * @param key 配置键
     */
    removeItem(key: string): void;

    /**
     * 配置键判断
     * @param key 配置键 
     * @returns 是否存在
     */
    hasItem(key: string): boolean;

    /** 所有配置键 */
    keys(): string[];

    /** 清理本地保存 */
    clear(): void;
}

/** 本地存储 */
class LocalStorage implements IStorage {
    getItem(key: string, def?: any): any {
        let value = sys.localStorage.getItem(key);
        if (value === null) {
            if (def !== undefined)
                return def;
            else
                return null;
        }
        return value;
    }

    setItem(key: string, data: any): void {
        sys.localStorage.setItem(key, String(data));
    }

    removeItem(key: string): void {
        sys.localStorage.removeItem(key);
    }

    hasItem(key: string): boolean {
        return sys.localStorage.getItem(key) !== null;
    }

    keys(): string[] {
        let keyArray: string[] = [];
        for (let i = 0; i < sys.localStorage.length; i++) {
            keyArray.push(sys.localStorage.key(i));
        }
        return keyArray;
    }

    clear(): void {
        sys.localStorage.clear();
    }
}

/** 平台存储 */
class PlatformStorage implements IStorage {
    //#region instance
    private static _instance: PlatformStorage = null;
    static get instance(): PlatformStorage {
        if (!this._instance) {
            this._instance = new PlatformStorage();
            //this._instance.init();
        }
        return this._instance;
    }
    //#endregion

    private _storage: IStorage = new LocalStorage();

    init(storage: IStorage): void {
        if (storage)
            this._storage = storage;
    }

    getItem(key: string, def?: any): any {
        return this._storage.getItem(key, def);
    }
    setItem(key: string, data: any): void {
        this._storage.setItem(key, data);
    }
    removeItem(key: string): void {
        this._storage.removeItem(key);
    }
    hasItem(key: string): boolean {
        return this._storage.hasItem(key);
    }
    keys(): string[] {
        return this._storage.keys();
    }
    clear(): void {
        this._storage.clear();
    }
}

/** 本地配置管理 */
class Configuration implements IStorage {
    //#region instance
    private static _instance: Configuration = null;
    static get instance(): Configuration {
        if (!this._instance) {
            this._instance = new Configuration();
            this._instance.init();
        }
        return this._instance;
    }
    //#endregion

    /** 缓存数据 */
    private _cacheData: { [key: string]: any } = {};
    /** 数据同步标记 */
    private _syncMark: { [key: string]: boolean } = {};
    /** 是否需要保存 */
    private _markSave: boolean = false;
    private _configStorage: IStorage = PlatformStorage.instance;

    private _isInit = false;
    private init() {
        if (this._isInit) return;
        this._isInit = true;

        setInterval(this.scheduleSave.bind(this), 500);
    }

    /** 定时保存 */
    private scheduleSave() {
        if (!this._markSave) {
            return;
        }
        this._markSave = false;

        // 遍历数据同步标记
        for (let key in this._syncMark) {
            if (!this._syncMark[key]) {
                this._syncMark[key] = true;

                this._configStorage.setItem(key, JSON.stringify(this._cacheData[key]));
            }
        }
    }

    getItem(key: string, def?: any): any {
        let value: any = null;
        if (this._cacheData[key] != undefined) {
            value = this._cacheData[key];
        }
        else {
            const jsonItem = this._configStorage.getItem(key);
            if (jsonItem) {
                value = JSON.parse(jsonItem);
                this._cacheData[key] = value;
            }
        }
        if (value == null) {
            if (def != undefined)
                return def;
            else
                return null;
        }
        return value;
    }

    setItem(key: string, value: any) {
        this._cacheData[key] = value;
        this._syncMark[key] = false;
        this._markSave = true;
    }

    removeItem(key: string): void {
        delete this._cacheData[key];
        delete this._syncMark[key];
        this._configStorage.removeItem(key);
    }

    hasItem(key: string): boolean {
        return this._configStorage.hasItem(key);
    }

    keys(): string[] {
        return this._configStorage.keys();
    }

    clear(): void {
        this._cacheData = {};
        this._syncMark = {};
        this._markSave = false;
        this._configStorage.clear();
    }

}

/** 多平台初始化 */
export function platformInit(storage: IStorage) {
    PlatformStorage.instance.init(storage);
}

/** Map转Object */
export function mapToObj(map: Map<string, any>): any {
    let obj = Object.create(null);
    for (let [k, v] of map) {
        obj[k] = v;
    }
    return obj;
}

/** Object转Map */
export function objToMap(obj: any): Map<string, any> {
    let map = new Map();
    for (let k of Object.keys(obj)) {
        map.set(k, obj[k]);
    }
    return map;
}

/** Object转Map */
export function objToMapSet(obj: any, map: Map<string, any>) {
    for (let k of Object.keys(obj)) {
        map.set(k, obj[k]);
    }
}

/** 
 * 本地存储
 * @example
 * config.setItem("str", "str");
 * config.setItem("num", 0);
 * config.setItem("bool", false);
 * config.setItem("object", { a: 1, b: 2 });
 * config.setItem("array", [ "a", "b" ]);
 * config.setItem("Array", new Array<string>());
 * // config.setItem("m", new Map<string, string>()); // 不支持
 * config.setItem("o", mapToObj(new Map<string, string>())); // 转换成object
 */
export const config = Configuration.instance;

/**
 * 本地存储配置单例模版方法
 * @param key 数据标识, 默认为类名
 * @example
 * class MyConfig extends SingletonConfig<MyConfig>("MyConfig") {
 *     // 自定义数据
 *     str: string = "str";
 *     num: number = 0;
 *     bool: boolean = false;
 *     object: object = { a: 1, b: 2 };
 *     array: string[] = [ "a", "b" ];
 *     list: Array<string> = new Array<string>();
 *     // map = new Map<string, string>(); 不支持 Map 类型
 * }
 * MyConfig.instance.str = "new str";
 * MyConfig.instance.save(); // 需要手动保存
 */
export function SingletonConfig<T>(key?: string) {
    class SingletonProxy {
        private static _key: string = "default";
        private static _instance: SingletonProxy = null;
        /**
         * 配置单例
         * @example
         * MyConfig.instance.str = "new str";
         * MyConfig.instance.save(); // 需要手动保存
         */
        static get instance(): T {
            if (SingletonProxy._instance == null) {
                SingletonProxy._key = key ? key : this.name;
                SingletonProxy._instance = new this();
                SingletonProxy._instance.load();
            }
            return SingletonProxy._instance as T;
        }

        private _isLoad: boolean = false;
        /** 加载数据 */
        private load(): void {
            if (this._isLoad) {
                return;
            }
            this._isLoad = true;

            // 加载数据
            let data = config.getItem(SingletonProxy._key);
            if (data) {
                Object.assign(SingletonProxy._instance, data);
            }
        }

        /** 保存数据 */
        save(): void {
            config.setItem(SingletonProxy._key, SingletonProxy._instance);
        }
    }

    return SingletonProxy;
}