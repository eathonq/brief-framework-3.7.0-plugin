/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

//#region Decorator

/**
 * 装饰器类数据信息
 */
type class_info = {
    property: string[],
    property_type: {},
    property_notify: {},
    function: string[],
}

/**
 * 装饰器数据种类枚举
 */
export enum DecoratorDataKind {
    /**
     * 简单类型
     * @example
     * String Number Boolean
     */
    Simple = 0,
    /** Object类型 */
    Object = 1,
    /** Array类型 */
    Array = 2,
    /** Function类型 */
    Function = 3,
    /** 未知类型 */
    Unknown = 4,
};

/** 装饰器数据 */
class DecoratorData {
    private _infoMap = new Map<string, class_info>();

    /**
     *
     */
    constructor() {
        // 设置默认的数据类型
        this.markProperty('String', 'String', String);
        this.markProperty('Number', 'Number', Number);
        this.markProperty('Boolean', 'Boolean', Boolean);
    }

    /**
     * 标记属性变更通知
     * @param tag 目标类名
     * @param key 目标属性名
     * @param type 目标属性类型
     * @param notify 通知回调函数名
     */
    markProperty(tag: string, key: string, type?: any, notify?: string) {
        let info = this._infoMap.get(tag);
        if (!info) {
            info = { property: [], property_type: {}, property_notify: {}, function: [] };
            this._infoMap.set(tag, info);
        }
        info.property.push(key);

        if (type) {
            info.property_type[key] = type;
        }
        else{
            info.property_type[key] = String;
        }

        if (notify) {
            info.property_notify[key] = notify;
        }
    }

    /**
     * 检查是否标记了属性变更通知
     * @param tag 目标类名
     * @param key 目标属性名
     * @returns 是否标记了属性变更通知，true标记了，false未标记
     */
    checkProperty(tag: string, key: string) {
        let info = this._infoMap.get(tag);
        if (info) {
            return info.property.indexOf(key) >= 0;
        }
        return false;
    }

    /**
     * 获取标记了属性变更通知的属性列表
     * @param tagPath 目标路径
     * @returns 标记了属性变更通知的属性列表
     */
    getPropertyList(tagPath: string) {
        let oo_type_list: {
            name: string;
            type: any;
            kind: DecoratorDataKind;
        }[] = [];
        let tagList = tagPath.split('.');
        let tagClass = tagList[tagList.length - 1];
        let info = this._infoMap.get(tagClass);
        if (info){
            for (let i = 0; i < info.property.length; i++) {
                let name = info.property[i];
                let type = info.property_type[name];
                let kind = DecoratorDataKind.Unknown;
                if (type) {
                    if (is_simple_type(type)) {
                        kind = DecoratorDataKind.Simple;
                    } else if (is_array_type(type)) {
                        kind = DecoratorDataKind.Array;
                    } else {
                        kind = DecoratorDataKind.Object;
                    }
                }
                oo_type_list.push({ name, type, kind });
            }
        }

        return oo_type_list;
    }

    /**
     * 获取通知回调函数名
     * @param tag 目标类名
     * @param key 目标属性名
     * @returns 通知回调函数名, 未标记返回undefined
     */
    getPropertyNotify(tag: string, key: string) {
        let info = this._infoMap.get(tag);
        if (info) {
            return info.property_notify[key];
        }
        return undefined;
    }

    /**
     * 标记方法通知
     * @param tag 目标类名
     * @param key 目标方法名
     */
    markFunction(tag: string, key: string) {
        let info = this._infoMap.get(tag);
        if (!info) {
            info = { property: [], property_type: {}, property_notify: {}, function: [] };
            this._infoMap.set(tag, info);
        }
        info.function.push(key);
    }

    /**
     * 获取标记的方法名列表
     * @param tagPath 目标路径
     * @returns 目标类中标记的方法名列表
     */
    getFunctionList(tagPath: string) {
        let oo_type_list: {
            name: string;
            type: any;
            kind: DecoratorDataKind;
        }[] = [];
        let tagList = tagPath.split('.');
        let tagClass = tagList[tagList.length - 1];
        let info = this._infoMap.get(tagClass);
        if (info){
            for (let i = 0; i < info.function.length; i++) {
                let name = info.function[i];
                let type = Function;
                let kind = DecoratorDataKind.Function;
                oo_type_list.push({ name, type, kind });
            }
        }
        return oo_type_list;
    }
}

/** 装饰器数据 */
export const decoratorData = new DecoratorData();

//#endregion

//#region oop

/**
 * mvvm 属性装饰器可选属性
 */
interface _mvvm_data_decorators_options {
    /**
     * 属性对象类型
     */
    type?: any;
    /**
     * 属性变更通知回调函数名
     */
    notify?: string;
}
function is_mvvm_data_decorators_options(options: any): options is _mvvm_data_decorators_options {
    return options && (options.type || options.notify);
}

/**
 * mvvm 属性装饰器基础类型
 */
type _mvvm_data_decorators_simple_property_type = String | Number | Boolean ;
function is_simple_type(type: any): type is _mvvm_data_decorators_simple_property_type {
    return type === String || type === Number || type === Boolean;
}

function is_array_type(type: any): type is Array<any> {
    return type instanceof Array;
}

/**
 * mvvm 属性装饰器
 * @param options 可选属性
 * @example
 * _@oop // 标记属性（基础类型可以使用 String | Number | Boolean）
 * _@oop(TypeClass) // 标记属性（非基础类型使用）
 * _@oop({ type: TypeClass }) // 标记属性对象类型
 * _@oop({ notify: 'onChanged' }) // 标记属性变更通知回调函数名
 * _@oop({ type: TypeClass, notify: 'onChanged' })
 */
export function oop(options?: _mvvm_data_decorators_options): any;
/**
 * mvvm 属性装饰器
 * @param type 属性对象类型（非基础类型使用）
 * @example
 * _@oop(TypeClass)
 */
export function oop(type: any): any;
/**
 * mvvm 属性装饰器
 */
export function oop(target: any, key?: string): void;
export function oop(...args: any[]) {
    if (args.length == 1) {
        let arg_0 = args[0];
        return function (target: any, key: string) {
            let tag = target.constructor.name;
            if (!tag) {
                console.error("oop: 请在类中使用。");
                return;
            }
            // 判断 arg_0 类型 是否为 _mvvm_data_decorators_options
            if (is_mvvm_data_decorators_options(arg_0)) {
                decoratorData.markProperty(tag, key, arg_0.type, arg_0.notify);
            }
            else{
                decoratorData.markProperty(tag, key, arg_0);
            }
        }
    }
    else {
        let target = args[0];
        if(!target) return;
        let key = args[1];
        let tag = target.constructor.name;
        if (!tag) {
            console.error("oop: 请在类中使用。");
            return;
        }
        decoratorData.markProperty(tag, key);
    }
}

//#endregion

//#region oof

/**
 * mvvm 方法装饰器
 */
export function oof(target: any, key: string, descriptor: PropertyDescriptor) {
    let tag = target.constructor.name;
    if (!tag) {
        console.error("oof: 请在类中使用。");
        return;
    }
    decoratorData.markFunction(tag, key);
}

//#endregion