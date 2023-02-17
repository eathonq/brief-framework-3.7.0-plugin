/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-15 18:45
 */

//#region Decorator

/** 装饰器类数据信息 */
type class_info = {
    /** 属性列表 */
    property: string[],
    /** 属性类型 */
    data_type: { [key: string]: string },
    /** 属性种类 */
    data_kind: { [key: string]: DataKind },
    /** 函数列表 */
    function: string[],
    /** 临时数据 */
    temp: any,
    /** 是否在编辑器阶段设置为默认值 */
    isSetDefaultInEditor: boolean,
}

/** 装饰器数据种类枚举 */
export enum DataKind {
    /** 未知类型 */
    Unknown = 0,
    /** String类型 */
    String = 1,
    /** Number类型 */
    Number = 2,
    /** Boolean类型 */
    Boolean = 3,
    /** Object类型 */
    Object = 4,
    /** Array类型 */
    Array = 5,
    /** Function类型 */
    Function = 6,
};

/**
 * 构造函数转换为数据种类
 * @param constructor 构造函数
 * @returns 数据种类
 */
function toDataKind(constructor: any) {
    if (constructor === String) {
        return DataKind.String;
    }
    else if (constructor === Number) {
        return DataKind.Number;
    }
    else if (constructor === Boolean) {
        return DataKind.Boolean;
    }
    else if (is_array_type(constructor)) {
        return DataKind.Array;
    }
    else {
        return DataKind.Object;
    }
}

/** 装饰器数据 */
class DecoratorData {

    /**
     * 装饰器类数据信息
     * @param key: 类名
     * @param value: 类数据信息
     */
    private _classInfoMap = new Map<string, class_info>();

    /**
     *
     */
    constructor() {
        // 设置默认的数据类型
        this.markProperty('String', 'String', String.name, DataKind.String);
        this.markProperty('Number', 'Number', Number.name, DataKind.Number);
        this.markProperty('Boolean', 'Boolean', Boolean.name, DataKind.Boolean);
    }

    private getInfo(className: string) {
        let info = this._classInfoMap.get(className);
        if (!info) {
            info = { property: [], data_type: {}, data_kind: {}, function: [], temp: null, isSetDefaultInEditor: false };
            this._classInfoMap.set(className, info);
        }
        return info;
    }

    /**
     * 标记类
     * @param className 目标类名 
     * @param temp 临时数据
     */
    markClass(className: string, temp: any) {
        let info = this.getInfo(className);
        info.temp = temp;
        info.isSetDefaultInEditor = true;

        // 没有指定类型的属性，使用默认值的类型
        for (let key in info.data_kind) {
            if (info.data_kind[key] == DataKind.Unknown) {
                if (temp[key] == null || temp[key] == undefined) {
                    console.warn(`${className} ${key} 请设置默认值，或在 @oop() 中指定类型。`);
                    continue;
                }
                info.data_type[key] = temp[key].constructor.name;
                info.data_kind[key] = toDataKind(temp[key].constructor);
            }
        }
    }

    /**
     * 标记属性变更通知
     * @param className 目标类名
     * @param prop 目标属性名
     * @param type 目标属性类型
     */
    markProperty(className: string, prop: string, type: string, kind: DataKind) {
        let info = this.getInfo(className);
        info.property.push(prop);
        info.data_type[prop] = type;
        info.data_kind[prop] = kind;
    }

    /**
     * 获取标记了属性变更通知的属性列表
     * @param className 目标类名
     * @returns 标记了属性变更通知的属性列表
     */
    getPropertyList(className: string) {
        let oo_type_list: {
            /** 属性名称 */
            name: string;
            /** 属性类型 */
            type: string;
            /** 属性种类 */
            kind: DataKind;
        }[] = [];
        let info = this._classInfoMap.get(className);
        if (info) {
            for (let i = 0; i < info.property.length; i++) {
                let name = info.property[i];
                let type = info.data_type[name];
                let kind = info.data_kind[name];
                oo_type_list.push({ name, type, kind });
            }
        }

        return oo_type_list;
    }

    /**
     * 标记方法通知
     * @param className 目标类名
     * @param func 目标方法名
     */
    markFunction(className: string, func: string) {
        let info = this.getInfo(className);
        info.function.push(func);
    }

    /**
     * 获取标记的方法名列表
     * @param className 目标类名
     * @returns 目标类中标记的方法名列表
     */
    getFunctionList(className: string) {
        let oo_type_list: {
            name: string;
            type: string;
            kind: DataKind;
        }[] = [];
        let info = this._classInfoMap.get(className);
        let type = Function.name;
        let kind = DataKind.Function;
        if (info) {
            for (let i = 0; i < info.function.length; i++) {
                let name = info.function[i];
                oo_type_list.push({ name, type, kind });
            }
        }
        return oo_type_list;
    }

    /**
     * 设置编辑状态下的默认值
     * @param temp 临时数据
     */
    setDefaultInEditor(temp: any) {
        let className = temp.constructor.name;
        let info = this._classInfoMap.get(className);
        if (info) {
            info.isSetDefaultInEditor = true;
            info.temp = temp;
        }
    }

    /**
     * 获取默认值
     * @param path 目标路径 
     * @returns 
     */
    getDefaultInEditor(path: string) {
        let pathList = path.split('.');
        if (pathList.length < 2) {
            return null;
        }
        let typeClass = pathList[0];
        let info = this._classInfoMap.get(typeClass);
        if (!info || !info.isSetDefaultInEditor) {
            return null;
        }

        // let temp = info.temp;
        // for (let i = 1; i < pathList.length; i++) {
        //     let key = pathList[i];
        //     temp = temp[key];
        // }
        // return temp;

        try {
            let temp = info.temp;
            for (let i = 1; i < pathList.length; i++) {
                let key = pathList[i];
                temp = temp[key];
                // 判断是否是数组
                if (temp instanceof Array) {
                    temp = temp[0];
                }
            }
            return temp;
        } catch (error) {
            console.warn(`${path}, ${error}`);
            return null;
        }
    }
}

/** 装饰器数据 */
export const decoratorData = new DecoratorData();

//#endregion

//#region oop

function is_array_type(type: any): type is Array<any> {
    return type instanceof Array;
}

/**
 * mvvm 属性装饰器
 * @param type 属性对象类型
 * @example
 * _@oop // 标记属性（有默认值属性使用）
 * _@oop(TypeClass) // 标记属性（没有默认值属性使用）
 */
export function oop(type: any): any;
/**
 * mvvm 属性装饰器
 * @example
 * _@oop // 标记属性（有默认值属性使用）
 * _@oop(TypeClass) // 标记属性（没有默认值属性使用）
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

            let kind: DataKind;
            let type = "";
            if (arg_0) {
                kind = toDataKind(arg_0);
                if(kind == DataKind.Array){
                    type = arg_0[0] ? arg_0[0].name : target.constructor.name;  // 自己的类型
                }
                else{
                    type = arg_0.name;
                }
            }
            else {
                kind = DataKind.Object;
                type = target.constructor.name; // 自己的类型
            }
            decoratorData.markProperty(tag, key, type, kind);
        }
    }
    else {
        let target = args[0];
        if (!target) return;
        let key = args[1];
        let tag = target.constructor.name;
        if (!tag) {
            console.error("oop: 请在类中使用。");
            return;
        }
        decoratorData.markProperty(tag, key, "unknown", DataKind.Unknown);
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


/**
 * 类装饰器
 * @example
 * _@ooc
 * export class MyClass {}
 */
export function ooc(constructor: any): void {
    decoratorData.markClass(constructor.name, new constructor());
}
//#endregion