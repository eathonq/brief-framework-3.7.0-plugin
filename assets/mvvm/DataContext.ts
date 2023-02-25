/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-15 18:45
 */

import { _decorator, Component, Node, Enum, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../cocos/Locator';
import { observe, unobserve } from '../common/ReactiveObserve';
import { decoratorData, DataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/**
 * 数据上下文组件基类
 * 绑定上级数据中的对象数据到组件上
 */
@ccclass('brief.DataContext')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/mvvm/datacontext')
@executeInEditMode
@menu('Brief/MVVM/DataContext')
export class DataContext extends Component {

    private _isRoot = false;
    /** 是否数据上下文根数据  */
    get isRoot() {
        return this._isRoot;
    }
    protected set isRoot(value) {
        this._isRoot = value;
    }

    private _bindDataKind = DataKind.Object;
    /** 绑定数据种类 */
    get bindDataKind() {
        return this._bindDataKind;
    }
    protected set bindDataKind(value) {
        this._bindDataKind = value;
    }

    @property
    private _parent: DataContext = null;
    /** 数据上下文路径 */
    @property({
        tooltip: '数据上下文',
        displayName: 'DataContext',
        readonly: true,
    })
    get parent() {
        return this._parent;
    }
    protected set parent(value) {
        this._parent = value;
    }

    @property
    private _bindingType = ""; // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    /** 绑定的数据类型（类名） */
    get bindingType() {
        return this._bindingType;
    }
    protected set bindingType(value) {
        this._bindingType = value;
    }

    @property
    protected _bindingName = ""; // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    get bindingName() {
        return this._bindingName;
    }

    protected _bindingEnums: { name: string, value: number, type: string }[] = [];
    private _binding = 0;
    /** 绑定对象或集合 */
    @property({
        type: Enum({}),
        tooltip: '绑定属性',
        visible() {
            return !this._isRoot;
        },
    })
    get binding() {
        return this._binding;
    }
    protected set binding(value) {
        this._binding = value;
        if (this._bindingEnums[value]) {
            this._bindingName = this._bindingEnums[value].name;
            this._bindingType = this._bindingEnums[value].type;
            this.selectedBinding();
        }
    }

    private _path = ''; // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    /** 数据路径（EDITOR编辑过程默认数据使用） */
    get path(): string {
        return this._path;
    }
    protected set path(val: string) {
        this._path = val;
    }

    /** 上一级绑定数据 */
    protected _upperData: any = null;

    /** 当前绑定数据 */
    protected _data: any = null;
    /** 当前绑定数据 */
    get dataContext() {
        return this._data;
    }

    //#region EDITOR
    onRestore() {
        if (this._isRoot) return;
        this.checkEditorComponent();
    }

    protected checkEditorComponent() {
        this.initParentDataContext();

        // 上下文数据异常，则不继续执行
        if (!this._parent) return;

        this.updateEditorBindingEnums();
    }

    /** 组件绑定数据类型更新 */
    private updateEditorBindingEnums() {
        // 设置绑定属性
        const newEnums = [];
        let dataList = decoratorData.getPropertyList(this._parent.bindingType);
        if (dataList) {
            let count = 0;
            if (this._bindDataKind === DataKind.Object) {
                dataList.forEach((item) => {
                    // 仅显示对象类型
                    if (item.kind === DataKind.Object) {
                        newEnums.push({ name: `${item.name}`, value: count++, type: item.type });
                    }
                });
            }
            else if (this._bindDataKind === DataKind.Array) {
                dataList.forEach((item) => {
                    // 仅显示数组
                    if (item.kind === DataKind.Array) {
                        newEnums.push({ name: `${item.name}`, value: count++, type: item.type });
                    }
                });
            }
        }
        // 更新绑定数据枚举
        this._bindingEnums = newEnums;
        CCClass.Attr.setClassAttr(this, 'binding', 'enumList', newEnums);

        // 如果绑定数据枚举为空，则警告
        if (this._bindingEnums.length === 0) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 DataContext 绑定未找到合适的数据（对象数据）`);
        }

        // 设置绑定数据枚举默认值
        if (this._bindingName !== '') {
            let findIndex = this._bindingEnums.findIndex((item) => { return item.name === this._bindingName; });
            if (findIndex != -1) {
                this.binding = findIndex;
                return
            }
            else {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 DataContext 绑定 ${this._bindingName} 已经不存在`);
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
        // 设置 EDITOR 状态下，绑定属性
        this.path = `${this._parent.path}.${this._bindingName}`;
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
            this._parent = DataContext.lookUp(this.node, false);
            if (!this._parent) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 DataContext 找不到上级 DataContext`);
                return;
            }
        }

        this._parent.register(this, this.onUpdateData);
    }

    /** 观察函数 */
    private _reaction = null;
    /** 绑定数据更新，子类重写 */
    protected onUpdateData() {
        // 上下文数据异常，则不继续执行
        if (!this._parent) return;

        this._upperData = this._parent.getDataContextInRegister(this);
        if (!this._upperData) return;

        if (this._reaction) {
            unobserve(this._reaction);
            this._reaction = null;
        }

        this._data = this._upperData[this._bindingName];
        // 设置观察函数
        this._reaction = observe((operation) => {
            this._data = this._upperData[this._bindingName];
            this.onUpdateDataInternal();
            if (!operation) return;

            this._registry.forEach((callback, target) => {
                callback.call(target);
            });

        }, this);
    }

    /** 绑定数据内部更新，子类重写 */
    protected onUpdateDataInternal() { }

    protected _registry: Map<any, Function> = new Map();
    /**
     * 注册
     * @param target 注册对象 
     * @param onUpdateData 数据更新回调
     */
    register(target: any, onUpdateData: Function) {
        this._registry.set(target, onUpdateData);
    }

    /**
     * 取消注册
     * @param target 注册对象 
     */
    unregister(target: any) {
        this._registry.delete(target);
    }

    /**
     * 获取数据上下文（需要先注册）
     * @param target 注册对象
     * @returns 数据上下文
     */
    getDataContextInRegister(target: any) {
        if (this._registry.has(target)) {
            return this._data;
        }
        return null;
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