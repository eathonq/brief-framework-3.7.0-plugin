/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-23 10:55
 */

import { _decorator, Node, Component, Enum, Sprite, Button, CCClass, Label, ProgressBar } from 'cc';
import { EDITOR } from 'cc/env';
import { observe, unobserve } from '../base/ReactiveObserve';
import { Locator } from '../common/Locator';
import { CCElement } from './CCElement';
import { DataContext } from "./DataContext";
import { decoratorData } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 绑定模式 */
export enum BindingMode {
    /** 双向绑定(View<=>Model)，导致对绑定源或目标属性(UI)的更改自动更新另一个。 */
    TwoWay = 0,
    /** 单向绑定(View<-Model)，当绑定源改变时更新绑定目标属性(UI)。 */
    OneWay = 1,
    /** 一次绑定(View<-Model)，当绑定源改变时更新绑定目标属性(UI)，仅通知一次。 */
    OneTime = 2,
    /** 单向绑定(View->Model)，当绑定目标属性(UI)改变时更新绑定源。 */
    OneWayToSource = 3,
}

/** 
 * 数据绑定组件
 * 绑定上级数据中的基础类型数据（String、Number、Boolean、Function）到组件上
 */
@ccclass('brief.Binding')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/mvvm/binding')
@executeInEditMode
@menu('Brief/MVVM/Binding')
export class Binding extends CCElement {

    /** 数据上下文路径 */
    @property(DataContext)
    private _parent: DataContext = null;
    @property({
        type: DataContext,
        displayName: 'DataContext',
        tooltip: '数据上下文',
    })
    get parent() {
        return this._parent;
    }
    private set parent(value) {
        this._parent = value;
        this.updateEditorBindingEnums();
    }

    @property
    private _bindingMode = -1; // 挂载 @property 属性值保存到场景等资源文件中，用于 binding 数据恢复
    private _modeEnums: { name: string, value: number, mode: BindingMode }[] = [];
    private _mode = 0;
    /** 绑定模式 */
    @property({
        type: Enum({}),
        tooltip: '绑定模式:\n TwoWay: 双向绑定(Model<->View);\n OneWay: 单向绑定(Model->View);\n OneTime: 一次单向绑定(Model->View);\n OneWayToSource: 单向绑定(Model<-View)。',
    })
    get mode() {
        return this._mode;
    }
    private set mode(value) {
        this._mode = value;
        if (this._modeEnums[value]) {
            this._bindingMode = this._modeEnums[value].mode;
        }
    }

    @property
    private _bindingType = "";  // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    get bindingType() {
        return this.bindingType;
    }

    @property
    private _bindingName = ""; // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    get bindingName() {
        return this._bindingName;
    }

    private _bindingEnums: { name: string, value: number, type: string }[] = [];
    private _binding = 0;
    /** 绑定属性 */
    @property({
        type: Enum({}),
        tooltip: '绑定属性',
    })
    get binding() {
        return this._binding;
    }
    private set binding(value) {
        this._binding = value;
        if (this._bindingEnums[value]) {
            this._bindingName = this._bindingEnums[value].name;
            this._bindingType = this._bindingEnums[value].type;
            this.selectedBinding();
        }
    }

    /** 上一级绑定数据 */
    private _upperData: any = null;

    /** 当前绑定数据 */
    protected _data: any = null;
    /** 当前绑定数据 */
    get dataContext() {
        return this._data;
    }

    //#region EDITOR
    onRestore() {
        this._parent = null;

        super.onRestore();
    }

    protected checkEditorComponent() {
        this.initParentDataContext();
        if (!this._parent) return; // 上下文数据异常，则不继续执行

        super.checkEditorComponent();
    }

    protected selectedProperty() {
        // TODO
        if (!this._parent) return; // 上下文数据异常，则不继续执行
        this.updateEditorModeEnums();
        this.updateEditorBindingEnums();
    }

    /** 更新绑定模式枚举 */
    private updateEditorModeEnums() {
        const newEnums = [];
        let count = 0;
        switch (this._elementName) {
            case Label.name:
                newEnums.push(...[
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                ]);
                break;
            case Button.name:
                newEnums.push(...[
                    { name: 'OneWayToSource', value: count++, mode: BindingMode.OneWayToSource },
                ]);
                break;
            case ProgressBar.name:
                newEnums.push(...[
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                ]);
                break;
            case Sprite.name:
                newEnums.push(...[
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                ]);
                break;
            default:
                newEnums.push(...[
                    { name: 'TwoWay', value: count++, mode: BindingMode.TwoWay },
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                    { name: 'OneWayToSource', value: count++, mode: BindingMode.OneWayToSource },
                ]);
                break;
        }

        this._modeEnums = newEnums;
        // 更新绑定模式枚举
        CCClass.Attr.setClassAttr(this, 'mode', 'enumList', newEnums);

        // 设置绑定模式枚举默认值
        if (this._bindingMode != -1) {
            let findIndex = this._modeEnums.findIndex((item) => { return item.mode == this._bindingMode; });
            if (findIndex != -1) {
                this.mode = findIndex;
                return;
            }
        }
        this.mode = 0;
    }

    /** 更新绑定数据枚举 */
    private updateEditorBindingEnums() {
        // 获取绑定属性
        const newEnums = [];
        let isFunc = this._elementName === Button.name;
        if (isFunc) {
            let dataList = decoratorData.getFunctionList(this._parent.bindingType);
            if (dataList) {
                let count = 0;
                dataList.forEach((item) => {
                    newEnums.push({ name: item.name, value: count++, type: item.type });
                });
            }
        }
        else {
            let dataList = decoratorData.getPropertyList(this._parent.bindingType);
            if (dataList) {
                let count = 0;
                dataList.forEach((item) => {
                    if (this._elementKinds.indexOf(item.kind) != -1) {
                        newEnums.push({ name: item.name, value: count++, type: item.type });
                    }
                });
            }
        }

        // 更新绑定数据枚举
        this._bindingEnums = newEnums;
        CCClass.Attr.setClassAttr(this, 'binding', 'enumList', newEnums);

        // 如果绑定数据枚举为空，则警告
        if (this._bindingEnums.length === 0) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 Binding 绑定未找到合适的数据（String,Number,Boolean）`);
        }

        // 设置绑定数据枚举默认值
        if (this._bindingName !== '') {
            let findIndex = this._bindingEnums.findIndex((item) => { return item.name === this._bindingName; });
            if (findIndex != -1) {
                this.binding = findIndex;
                return;
            }
            else {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件Binding绑定 ${this._bindingName} 已经不存在`);
                // 如果只有一个枚举，就设置为默认值
                if (this._bindingEnums.length == 1) {
                    this.binding = 0;
                    return;
                }
            }
        }
        this.binding = 0;
    }

    protected selectedBinding() {
        if (this._parent) {
            if (this._elementName === Button.name) return;

            let path = this._parent.path;
            path = this._bindingName === this._bindingType ? path : `${path}.${this._bindingName}`;
            // 通过地址获取默认值
            let data = decoratorData.getDefaultInEditor(path);
            if (data != null) {
                this.setElementValue(data);
            }
        }
    }

    //#endregion

    protected onLoad() {
        if (EDITOR) {
            this.checkEditorComponent();
            return;
        }

        this.initParentDataContext();

        // 设置绑定模式
        switch (this._bindingMode) {
            case BindingMode.TwoWay:
                //this._parent?.bind(this._path, this.onDataChange, this);
                this._isObservable = true;
                this.onElementCallback(this.onElementValueChange.bind(this));
                break;
            case BindingMode.OneWay:
                this._isObservable = true;
                break;
            case BindingMode.OneTime:
                this._isObservable = true; // 在数据回调通知的时候判断接触绑定
                break;
            case BindingMode.OneWayToSource:
                this.onElementCallback(this.onElementValueChange.bind(this));
                break;
        }

        this.onUpdateData();
    }

    protected onDestroy() {
        if (EDITOR) return;

        this._parent?.unregister(this);

        if (this._reaction) {
            unobserve(this._reaction);
            this._reaction = null;
        }
    }

    private initParentDataContext() {
        if (!this._parent) {
            this._parent = DataContext.lookUp(this.node, true);
            if (!this._parent) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 Binding 找不到上级 DataContext`);
                return;
            }
        }

        this._parent.register(this, this.onUpdateData);
    }

    private _isObservable = false;
    /** 观察函数 */
    private _reaction = null;
    private onUpdateData() {
        // 上下文数据异常，则不继续执行
        if (!this._parent) return;

        this._upperData = this._parent.getDataContextInRegister(this);
        if (!this._upperData) return;

        if (this._reaction) {
            unobserve(this._reaction);
            this._reaction = null;
        }

        this._data = this._upperData[this._bindingName];
        if (this._isObservable) {
            // 设置观察函数
            this._reaction = observe((operation) => {
                let data = this._upperData[this._bindingName];
                if (!operation) return;

                this.setDataValue(data);
            }, this);
        }

        this.setDataValue(this._data);
    }

    protected setDataValue(value: any) {
        this.setElementValue(value);

        // 如果是一次绑定，则解绑
        if (this._bindingMode === BindingMode.OneTime) {
            if (this._reaction) {
                unobserve(this._reaction);
            }
        }
    }

    private onElementValueChange(value: any) {
        if (this._upperData && Reflect.has(this._upperData, this._bindingName)) {
            if (this._upperData[this._bindingName] instanceof Function) {
                this._upperData[this._bindingName](value);
            }
            else {
                Reflect.set(this._upperData, this._bindingName, value);
            }
        }
    }
}