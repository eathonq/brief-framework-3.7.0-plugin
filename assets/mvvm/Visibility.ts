/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-15 18:45
 */

import { _decorator, Node, Component, Enum, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
import { observe, unobserve } from '../common/ReactiveObserve';
import { BindingMode } from './Binding';
import { DataContext } from "./DataContext";
import { decoratorData, DataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 
 * 数据绑定组件
 * 绑定上级数据中的Boolean类型数据到组件上
 */
@ccclass('brief.Visibility')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/mvvm-mvvm-kuang-jia/visibility')
@executeInEditMode
@menu('Brief/MVVM/Visibility')
export class Visibility extends Component {

    /** 绑定组件的名字 */
    @property({
        tooltip: '绑定组件的名字',
        displayName: 'Component',
        readonly: true,
        serializable: false,
    })
    private componentName: string = Node.name;

    /** 组件上需要监听的属性 */
    @property({
        tooltip: '组件上需要监听的属性',
        displayName: 'Property',
        readonly: true,
        serializable: false,
    })
    private componentProperty: string = "active";

    /** 数据上下文路径 */
    @property(DataContext)
    private _parent: DataContext = null;
    @property({
        type: DataContext,
        tooltip: '数据上下文',
    })
    private get parent() {
        return this._parent;
    }
    private set parent(value) {
        this._parent = value;
        this.updateEditorBindingEnums();
    }

    @property
    private _bindingMode = 1;
    private _modeEnums: { name: string, value: number, mode: BindingMode }[] = [];
    private _mode = 0;
    /** 绑定模式 */
    @property({
        type: Enum({}),
        tooltip: '绑定模式:\n TwoWay: 双向绑定(Model<->View);\n OneWay: 单向绑定(Model->View);\n OneTime: 一次单向绑定(Model->View);\n OneWayToSource: 单向绑定(Model<-View)。',
    })
    private get mode() {
        return this._mode;
    }
    private set mode(value) {
        this._mode = value;
        if (this._modeEnums[value]) {
            this._bindingMode = this._modeEnums[value].mode;
        }
    }

    @property
    private _bindingName = "";  // 挂载 @property 属性值保存到场景等资源文件中，用于 binding 数据恢复
    private _bindingEnums: { name: string, value: number }[] = [];
    private _binding = 0;
    /** 绑定属性 */
    @property({
        type: Enum({}),
        tooltip: '绑定属性',
    })
    private get binding() {
        return this._binding;
    }
    private set binding(value) {
        this._binding = value;
        if (this._bindingEnums[value]) {
            this._bindingName = this._bindingEnums[value].name;
        }
    }

    /** 当前绑定数据 */
    protected _data: any = null;
    /** 当前绑定数据 */
    get dataContext() {
        return this._data;
    }

    /** 上一级绑定数据 */
    private upperDataContext: any = null;

    //#region EDITOR
    onRestore() {
        this._parent = null;
        this.checkEditorComponent();
    }

    private checkEditorComponent() {
        this.initParentDataContext();

        // 上下文数据异常，则不继续执行
        if (!this._parent) return;

        this.updateEditorModeEnums();
        this.updateEditorBindingEnums();
    }

    /** 更新绑定模式枚举 */
    private updateEditorModeEnums() {
        const newEnums = [];
        let count = 0;
        newEnums.push(...[
            { name: 'TwoWay', value: count++, mode: BindingMode.TwoWay },
            { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
            { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
            { name: 'OneWayToSource', value: count++, mode: BindingMode.OneWayToSource },
        ]);
        this._modeEnums = newEnums;
        // 更新绑定模式枚举
        CCClass.Attr.setClassAttr(this, 'mode', 'enumList', newEnums);

        // 设置绑定模式枚举默认值
        if (this._bindingMode != -1) {
            let findIndex = this._modeEnums.findIndex((item) => {
                return item.mode == this._bindingMode;
            });
            if (findIndex === -1) {
                this.mode = 0;
            }
            else {
                this.mode = findIndex;
            }
        }
        else {
            this.mode = 1;
        }
    }

    /** 更新绑定数据枚举 */
    private updateEditorBindingEnums() {
        // 获取绑定属性
        const newEnums = [];
        let dataList = decoratorData.getPropertyList(this._parent.bindingType);
        if (dataList) {
            let count = 0;
            dataList.forEach((item) => {
                if (item.kind === DataKind.Boolean) {
                    newEnums.push({ name: item.name, value: count++ });
                }
            });
        }
        // 更新绑定数据枚举
        this._bindingEnums = newEnums;
        CCClass.Attr.setClassAttr(this, 'binding', 'enumList', newEnums);

        // 如果绑定数据枚举为空，则警告
        if (this._bindingEnums.length === 0) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 Visibility 绑定未找到合适的数据（Boolean）`);
        }

        // 设置绑定数据枚举默认值
        if (this._bindingName !== '') {
            let findIndex = this._bindingEnums.findIndex((item) => { return item.name === this._bindingName; });
            if (findIndex === -1) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 Visibility 绑定 ${this._bindingName} 已经不存在`);
                // 如果只有一个枚举，就设置为默认值
                if (this._bindingEnums.length == 1) {
                    this.binding = 0;
                }
            }
            else {
                this.binding = findIndex;
            }
        }
        else {
            this.binding = 0;
        }
    }

    //#endregion

    protected onLoad() {
        if (EDITOR) {
            this.checkEditorComponent();
            return;
        }

        this.initParentDataContext();

        // 上下文数据异常，则不继续执行
        if (!this._parent) return;

        // 设置绑定模式
        switch (this._bindingMode) {
            case BindingMode.TwoWay:
                //this._parent?.bind(this._path, this.onDataChange, this);
                this._isObservable = true;
                this.onComponentCallback();
                break;
            case BindingMode.OneWay:
                this._isObservable = true;
                break;
            case BindingMode.OneTime:
                this._isObservable = true; // 在数据回调通知的时候判断接触绑定
                break;
            case BindingMode.OneWayToSource:
                this.onComponentCallback();
                break;
        }
    }

    protected onEnable() {
        if (EDITOR) return;

        this.onUpdateData();
    }

    protected onDisable() {
        if (EDITOR) return;

        if (this._isObservable && this._reaction) {
            unobserve(this._reaction);
        }
    }

    private initParentDataContext() {
        if (!this._parent) {
            this._parent = DataContext.lookUp(this.node, true);
            if (!this._parent) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 Visibility 找不到上级 DataContext`);
            }
        }

        this._parent.addUpdateCallback(this.onUpdateData.bind(this));
    }

    private _isObservable = false;
    /** 观察函数 */
    private _reaction = null;
    private onUpdateData() {
        if (!this._parent.dataContext) return;

        // 数组类型数据，重新设置绑定属性（重新定位数组元素）
        if (this._parent.bindDataKind === DataKind.Array) {
            let index = this._parent.getItemIndex(this.node);
            this.upperDataContext = this._parent.dataContext[index];
        }
        else {
            this.upperDataContext = this._parent.dataContext;
        }

        this._data = this.upperDataContext[this._bindingName];
        if (this._isObservable) {
            // 设置观察函数
            this._reaction = observe((operation) => {
                let data = this.upperDataContext[this._bindingName];
                if (!operation) return;

                this.setComponentValue(data);
            }, this);
        }

        this.setComponentValue(this._data);
    }

    private setComponentValue(value: any) {
        if (value === undefined || value === null) return;

        this.node.active = value !== false;

        // 如果是一次绑定，则解绑
        if (this._bindingMode === BindingMode.OneTime) {
            if (this._reaction) {
                unobserve(this._reaction);
            }
        }
    }

    private onComponentCallback() {
        this.node.on(Node.EventType.ACTIVE_IN_HIERARCHY_CHANGED, () => {
            this.upperDataContext[this._bindingName] = this.node.active;
        }, this);
    }
}