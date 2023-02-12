/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 13:06
 */

import { _decorator, Component, Node, Enum, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
import { observe } from '../common/ReactiveObserve';
import { decoratorData, DecoratorDataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/**
 * 数据上下文组件基类
 */
@ccclass('brief.DataContext')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/mvvm-mvvm-kuang-jia/datacontext')
@executeInEditMode
@menu('Brief/MVVM/DataContext')
export class DataContext extends Component {

    /** 是否数据上下文根数据  */
    protected _isRoot = false;

    /** 绑定数据种类 */
    protected _bindDataKind = DecoratorDataKind.Object;

    /** 数据上下文路径 */
    @property({
        tooltip: '数据上下文',
        readonly: true,
        displayName: 'DataContext'
    })
    protected parent: DataContext = null;

    @property
    protected _bindingName = "";
    @property
    protected _bindingType = "";
    protected _bindingEnums: { name: string, value: number, type: string }[] = [];
    private _binding = 0;
    /** 绑定对象或集合 */
    @property({
        tooltip: '绑定对象或集合',
        type: Enum({}),
        serializable: true,
        visible() {
            return !this._isRoot;
        }
    })
    protected get binding() {
        return this._binding;
    }
    protected set binding(value) {
        this._binding = value;
        if (this._bindingEnums[value]) {
            this._bindingName = this._bindingEnums[value].name;
            this._bindingType = this._bindingEnums[value].type;
            this.selectedBindItemsType();
        }
    }

    private _path = '';
    /** 数据路径 */
    get path(): string {
        return this._path;
    }
    protected set path(val: string) {
        this._path = val;
    }
    /** 当前绑定数据 */
    protected _data: any = null;
    /** 当前绑定数据 */
    get dataContext() {
        return this._data;
    }

    /** 上一级绑定数据 */
    protected upperDataContext: any = null;

    //#region EDITOR
    onRestore() {
        if (this._isRoot) return;
        this.checkEditorComponent();
    }

    protected checkEditorComponent() {
        this.initParentDataContext();
        this.updateEditorBindingEnums();
    }

    /** 组件绑定数据类型更新 */
    private updateEditorBindingEnums() {
        // 设置绑定属性
        let dataList = decoratorData.getPropertyList(this.parent.path);
        if (dataList) {
            const newEnums = [];
            let count = 0;
            if (this._bindDataKind === DecoratorDataKind.Object) {
                dataList.forEach((item) => {
                    // 仅显示对象类型
                    if (item.kind === DecoratorDataKind.Object) {
                        newEnums.push({ name: `${item.name}`, value: count++, type: item.type });
                    }
                });
            }
            else if (this._bindDataKind === DecoratorDataKind.Array) {
                dataList.forEach((item) => {
                    // 仅显示数组
                    if (item.kind === DecoratorDataKind.Array) {
                        newEnums.push({ name: `${item.name}`, value: count++, type: item.type });
                    }
                });
            }

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

    private selectedBindItemsType() {
        // 设置 EDITOR 状态下，绑定属性
        this.path = `${this.parent.path}.${this._bindingName}.${this._bindingType}`;
    }
    //#endregion

    /**
     * 子类重写此方法需要调用 super.onLoad()
     * @example
     * protected onLoad() {
     *    super.onLoad();
     *    if (EDITOR) return;
     *    // TODO
     * }
     */
    protected onLoad() {
        if (this._isRoot) return;

        if (EDITOR) {
            this.checkEditorComponent();
            return;
        }

        this.initParentDataContext();
        this.path = this._bindingName !== "" ? `${this.parent.path}.${this._bindingName}` : this.parent.path;
        this.onUpdateData();
    }

    private initParentDataContext() {
        if (this.parent) return;
        this.parent = DataContext.lookUp(this.node, false);
        if (!this.parent) {
            console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 ItemsSource `, '找不到 DataContext');
        }

        this.parent.addUpdateCallback(this.onUpdateData.bind(this));
    }

    /** 绑定数据更新，子类重写 */
    protected onUpdateData() {
        this.upperDataContext = this.parent._data;
        this._data = this.upperDataContext[this._bindingName];

        // 设置观察函数
        observe((() => {
            this._data = this.upperDataContext[this._bindingName];
            this._updateCallbackList.forEach((callback) => {
                callback();
            });
        }).bind(this));
    }

    protected _updateCallbackList: Function[] = [];
    /** 添加数据更新回调 */
    addUpdateCallback(callback: Function) {
        this._updateCallbackList.push(callback);
    }

    /**
     * 向上（父节点）查找数据上下文节点
     * @param current 当前节点
     * @param fromCurrent 是否从当前节点开始查找
     * @returns 数据上下文节点
     */
    static lookUp(current: Node, fromCurrent = true): DataContext {
        let node = fromCurrent ? current : current.parent;
        while (node) {
            let dataContext = node.getComponent(DataContext);
            if (dataContext) {
                return dataContext;
            }
            node = node.parent;
        }
        return null;
    }

    /**
     * 向下（子节点）查找数据上下文节点
     * @param current 当前节点
     * @returns 数据上下文节点
     */
    static lookDown(current: Node): DataContext {
        let dataContext = current.getComponentInChildren(DataContext);
        if (dataContext) {
            return dataContext;
        }
        return null;
    }
}