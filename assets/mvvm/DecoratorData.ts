/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-03-03 10:28
 */

/** 装饰器类数据信息 */
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
}

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
    /** 是否全局 */
    isGlobal: boolean,
}

function is_array_type(type: any): type is Array<any> {
    return type instanceof Array;
}

/**
 * 构造函数转换为数据种类
 * @param constructor 构造函数
 * @returns 数据种类
 */
export function toDataKind(constructor: any) {
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
            info = {
                property: [],
                data_type: {},
                data_kind: {},
                function: [],
                temp: null,
                isSetDefaultInEditor: false,
                isGlobal: false,
            };
            this._classInfoMap.set(className, info);
        }
        return info;
    }

    /**
     * 标记类
     * @param className 目标类名 
     * @param temp 临时数据
     * @param isGlobal 是否全局
     */
    markClass(className: string, temp: any, isGlobal: boolean) {
        let info = this.getInfo(className);
        info.temp = temp;
        info.isSetDefaultInEditor = false;
        info.isGlobal = isGlobal;

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
     * 获取标记了类的ViewModel列表
     * @param view 视图名称, 用于排序
     * @returns 
     */
    getViewModelList(view: string) {
        let oo_vm_list: {
            /** ViewModel名称 */
            name: string;
        }[] = [];
        // 遍历所有的ViewModel
        for (let [key, value] of this._classInfoMap) {
            // 判断 key 是否以 "ViewModel" 结尾
            if (key.endsWith("ViewModel")) {
                // 判断名称是否包含 view
                if (key.includes(view) || value.isGlobal) {
                    oo_vm_list.push({ name: key });
                }
            }
        }
        if (view.endsWith("View")) {
            // 排序，如果名称包含 view，则放在前面
            oo_vm_list.sort((a, b) => {
                if (a.name.includes(view) && !b.name.includes(view)) {
                    return -1;
                }
                else if (!a.name.includes(view) && b.name.includes(view)) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        }
        return oo_vm_list;
    }

    /**
     * 获取标记了类的Model列表
     * @param className 
     * @returns 
     */
    createViewModel(className: string) {
        let info = this._classInfoMap.get(className);
        if (info) {
            if (info.isGlobal) {
                return info.temp;
            }
            else {
                return new info.temp.constructor();
            }
        }
        return null;
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

export const decoratorData = new DecoratorData();