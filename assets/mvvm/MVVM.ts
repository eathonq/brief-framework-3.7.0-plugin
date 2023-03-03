/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-03-02 09:29
 */

import { DataKind, decoratorData, toDataKind } from "./DecoratorData";
import { viewModelManager } from "./ViewModel";

//#region vm
/**
 * mvvm ViewModel 装饰器（请以 ViewModel 结尾）
 * @param isGlobal 是否全局数据，默认为 false
 * @example
 * *@vm(true)* // 全局数据
 * class MyViewModel {}
 */
export function vm(isGlobal: boolean): any;
/**
 * mvvm ViewModel 装饰器（请以 ViewModel 结尾）
 * @example
 * *@vm*
 * class MyViewModel {}
 */
export function vm(constructor: any): void;
export function vm(...args: any[]) {
    if (args.length == 1) {
        let arg_0 = args[0];
        if (typeof arg_0 == "boolean") {
            return function (constructor: any) {
                decoratorData.markClass(constructor.name, new constructor(), arg_0);
            }
        }
        else {
            decoratorData.markClass(arg_0.name, new arg_0(), false);
        }
    }
}
//#endregion

//#region prop
/**
 * mvvm 属性装饰器
 * @param type 属性对象类型
 * @example
 * *@prop* // 标记属性（有默认值属性使用）
 * str = "hello";
 * 
 * *@prop(TypeClass)* // 标记属性（没有默认值属性使用）
 * obj = null;
 */
export function prop(type: any): any;
/**
 * mvvm 属性装饰器
 * @example
 * *@prop* // 标记属性（有默认值属性使用）
 * str = "hello";
 * 
 * *@prop(TypeClass)* // 标记属性（没有默认值属性使用）
 * obj = null;
 */
export function prop(target: any, key?: string): void;
export function prop(...args: any[]) {
    if (args.length == 1) {
        let arg_0 = args[0];
        return function (target: any, key: string) {
            let tag = target.constructor.name;
            if (!tag) {
                console.error("prop: 请在类中使用。");
                return;
            }

            let kind: DataKind;
            let type = "";
            if (arg_0) {
                kind = toDataKind(arg_0);
                if (kind == DataKind.Array) {
                    type = arg_0[0] ? arg_0[0].name : target.constructor.name;  // 自己的类型
                }
                else {
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
            console.error("prop: 请在类中使用。");
            return;
        }
        decoratorData.markProperty(tag, key, "unknown", DataKind.Unknown);
    }
}
//#endregion

//#region func
/**
 * mvvm 方法装饰器
 * @example
 * ```ts
 * // define function
 * @func
 * myFunction() {}
 * ```
 */
export function func(target: any, key: string, descriptor: PropertyDescriptor) {
    let tag = target.constructor.name;
    if (!tag) {
        console.error("oof: 请在类中使用。");
        return;
    }
    decoratorData.markFunction(tag, key);
}
//#endregion

/** mvvm */
export namespace mvvm {
    /**
     * 设置编辑状态下的默认值
     * @param data 临时数据
     */
    export function editor(data: any) {
        decoratorData.setDefaultInEditor(data);
    }

    /** 
     * 获取视图模型数据
     * @param name 视图模型名称
     * @param view 指定视图名称
     * @returns 视图模型数据
     */
    export function getViewModelWithName(name: string, view?: string): any {
        return viewModelManager.getWithName(name, view);
    }

    /**
     * 获取视图模型数据
     * @param constructor 视图模型构造函数
     * @param view 指定视图名称
     * @returns 视图模型数据
     */
    export function getViewModel<T>(constructor: any, view?: string): T {
        return viewModelManager.get(constructor, view);
    }
}