/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 13:06
 */

import { _decorator, Node, Component, Enum, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
import { observe, Operation, unobserve } from '../common/ReactiveObserve';
import { BindingMode } from './Binding';
import { DataContext } from "./DataContext";
import { ItemsSource } from './ItemsSource';
import { decoratorData, DecoratorDataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 数据绑定组件 */
@ccclass('brief.Visibility')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/mvvm-mvvm-kuang-jia/visibility')
@executeInEditMode
@menu('Brief/MVVM/Visibility')
export class Visibility extends Component {

    /** 数据上下文路径 */
    @property({ visible: false })
    private parent: DataContext = null;
    @property({
        tooltip: '数据上下文',
        displayName: 'DataContext',
        visible: true,
    })
    private get _parent() {
        return this.parent;
    }
    private set _parent(value) {
        this.parent = value;
        this.updateEditorBindingEnums();
    }

    @property
    private _bindingMode = 1;
    private _modeEnums: { name: string, value: number, mode: BindingMode }[] = [];
    private _mode = 0;
    /** 绑定模式 */
    @property({
        tooltip: '绑定模式:\n TwoWay: 双向绑定(Model<->View);\n OneWay: 单向绑定(Model->View);\n OneTime: 一次单向绑定(Model->View);\n OneWayToSource: 单向绑定(Model<-View)。',
        type: Enum({}),
        serializable: true,
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
    private _bindingName = "";
    private _bindingEnums: { name: string, value: number }[] = [];
    private _binding = 0;
    /** 绑定属性 */
    @property({
        tooltip: '绑定属性',
        type: Enum({}),
        serializable: true,
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
        this.parent = null;
        this.checkEditorComponent();
    }

    private checkEditorComponent() {
        this.initParentDataContext();

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
            let findIndex = newEnums.findIndex((item) => {
                return item.mode == this._bindingMode;
            });
            if (findIndex === -1) {
                console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 Binding `, '绑定模式枚举默认值设置失败');
                // 如果只有一个枚举，就设置为默认值
                if (this._bindingEnums.length == 1) {
                    this.binding = 0;
                }
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
        let dataList = decoratorData.getPropertyList(this.parent.path);
        // 更新绑定数据枚举
        if (dataList) {
            const newEnums = [];
            let count = 0;
            dataList.forEach((item) => {
                if (item.kind === DecoratorDataKind.Simple) {
                    newEnums.push({ name: item.name, value: count++ });
                }
            });
            this._bindingEnums = newEnums;
            CCClass.Attr.setClassAttr(this, 'binding', 'enumList', newEnums);
        }
        else {
            this._bindingEnums = [];
            CCClass.Attr.setClassAttr(this, 'binding', 'enumList', []);
        }

        // 设置绑定数据枚举默认值
        if (this._bindingName !== '') {
            let findIndex = this._bindingEnums.findIndex((item) => { return item.name === this._bindingName; });
            if (findIndex === -1) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} `, `组件Binding绑定 ${this._bindingName} 已经不存在`);
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
        if (!this.parent) {
            this.parent = DataContext.lookUp(this.node, true);
            if (!this.parent) {
                console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 ItemsSource `, '找不到 DataContext');
            }
        }

        this.parent.addUpdateCallback(this.onUpdateData.bind(this));
    }

    private _isObservable = false;
    /** 观察函数 */
    private _reaction = null;
    private onUpdateData() {
        if (!this.parent.dataContext) return;

        // 数组类型数据，重新设置绑定属性（重新定位数组元素）
        if (this.parent instanceof ItemsSource) {
            let index = this.parent.getItemIndex(this.node);
            this.upperDataContext = this.parent.dataContext[index];
        }
        else {
            this.upperDataContext = this.parent.dataContext;
        }

        this._data = this.upperDataContext[this._bindingName];
        if (this._isObservable) {
            // 设置观察函数
            this._reaction = observe(((operation: Operation) => {
                let data = this.upperDataContext[this._bindingName];
                if (!operation) return;

                this.setComponentValue(data);
            }).bind(this));
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