/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Component, Node, Enum, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
import { decoratorData, DecoratorDataKind } from './MVVM';
import { BindCallback, Observable } from "./Observable";
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/**
 * 数据上下文组件基类
 */
@ccclass('brief.DataContext')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/mvvm-mvvm-kuang-jia/datacontext')
@executeInEditMode
@menu('Brief/MVVM/DataContext')
export class DataContext extends Component {
    
    private _isRoot = false;
    /** 是否根数据上下文  */
    protected get isRoot() {
        return this._isRoot;
    }
    protected set isRoot(val: boolean) {
        this._isRoot = val;
    }

    /** 绑定数据种类 */
    protected bindDataKind = DecoratorDataKind.Object;

    /** 数据上下文 */
    @property({
        tooltip: '数据上下文',
        readonly: true,
        displayName: 'DataContext',
        override: true
    })
    private get parentPath() {
        return this._context?.path;
    };

    //#region 绑定属性
    @property
    protected _bindingName = "";

    @property
    protected _bindingType = "";

    protected _bindingEnums: { name: string, value: number, type: string }[] = [];
    private _binding = 0;
    @property({
        tooltip: '绑定集合或对象',
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
    //#endregion

    private _path = '';
    /** 数据绑定全路径 */
    get path(): string {
        return this._path;
    }
    protected set path(val: string) {
        this._path = val;
    }

    private _observable: Observable = null;
    /** 数据观察管理器 */
    get observable(): Observable {
        return this._observable;
    }
    protected set observable(val: Observable) {
        this._observable = val;
    }

    /** 绑定上下文 */
    protected _context: DataContext = null;

    onRestore() {
        this.checkEditorComponent();
    }

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
        this.checkEditorComponent();
        if(EDITOR) return;
        if (this.isRoot) return;

        if (!this._context) {
            this._context = DataContext.lookUpDataContext(this.node, false);
            if (!this._context) {
                console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 ItemsSource `, '找不到 DataContext');
                return;
            }
            this.observable = this._context.observable;
        }

        this.path = this._bindingName !== "" ? `${this._context.path}.${this._bindingName}` : this._context.path;
    }

    //#region EDITOR
    protected checkEditorComponent() {
        if (!EDITOR) return;
        if (this.isRoot) return;

        // 上下文数据查找
        let context = DataContext.lookUpDataContext(this.node, false);
        if (!context) {
            console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 ItemsSource `, '找不到 DataContext');
            return;
        }
        this._context = context;
        this.observable = this._context.observable;

        this.updateEditorBindDataEnum(context);
    }

     /** 组件绑定数据类型更新 */
    private updateEditorBindDataEnum(context: DataContext) {
        // 设置绑定属性
        let dataList = decoratorData.getPropertyList(context.path);
        if (dataList) {
            const arr = [];
            let count = 0;
            if(this.bindDataKind === DecoratorDataKind.Object){
                dataList.forEach((item) => {
                    // 仅显示对象类型
                    if(item.kind === DecoratorDataKind.Object){
                        arr.push({ name: `${item.name}`, value: count++, type: item.type.name });
                    }
                });
            }
            else if(this.bindDataKind === DecoratorDataKind.Array){
                dataList.forEach((item) => {
                    // 仅显示数组
                    if(item.kind === DecoratorDataKind.Array){
                        arr.push({ name: `${item.name}`, value: count++, type: item.type[0].name });
                    }
                });
            } 
            
            this._bindingEnums = arr;
            CCClass.Attr.setClassAttr(this, 'binding', 'enumList', arr);
        }
        else {
            this._bindingEnums = [];
            CCClass.Attr.setClassAttr(this, 'binding', 'enumList', []);
        }

        // 初始化绑定枚举
        if (this._bindingName !== '') {
            let findIndex = this._bindingEnums.findIndex((item) => { return item.name === this._bindingName; });
            if (findIndex === -1) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} `, `组件Binding绑定 ${this._bindingName} 已经不存在`);
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
        this.path = `${this._context.path}.${this._bindingName}.${this._bindingType}`;
    }
    //#endregion

    /**
     * 绑定数据
     * @param path 数据路径
     * @param callback 回调函数
     * @param target 回调函数的对象
     * @returns 
     */
    bind(path: string, callback: BindCallback, target?: any): void {
        this.observable?.bind(path, callback, target);
    }

    /**
     * 解除绑定
     * @param path 数据路径
     * @param callback 回调函数
     * @param target 回调函数的对象
     * @returns 
     */
    unbind(path: string, callback: BindCallback, target?: any): void {
        this.observable?.unbind(path, callback, target);
    }

    /**
     * 设置数据
     * @param path 数据路径
     * @param value 数据值
     */
    setValue(path: string, value: any) {
        this.observable?.setValue(path, value);
    }

    /**
     * 获取数据
     * @param path 数据路径 
     * @param def 默认值
     * @returns 
     */
    getValue(path: string, def?: any) {
        return this.observable?.getValue(path, def);
    }

    /**
     * 执行UI组件回调
     * @param path 数据路径 
     * @param customEventData 自定义数据
     */
    doCallback(path: string, customEventData?: string) {
        this.observable?.doCallback(path, customEventData);
    }

    /**
     * 向上（父节点）查找数据上下文节点
     * @param current 当前节点
     * @param fromCurrent 是否从当前节点开始查找
     * @returns 数据上下文节点
     */
    static lookUpDataContext(current: Node, fromCurrent = true): DataContext {
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
    static lookDownDataContext(current: Node): DataContext {
        let dataContext = current.getComponentInChildren(DataContext);
        if (dataContext) {
            return dataContext;
        }
        return null;
    }
}