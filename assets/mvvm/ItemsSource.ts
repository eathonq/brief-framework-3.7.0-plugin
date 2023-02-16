/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-15 18:45
 */

import { _decorator, Node, instantiate, NodePool, Enum, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
import { observe, reactive } from '../common/ReactiveObserve';
import { DataContext } from "./DataContext";
import { decoratorData, DataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 
 * 数据集合绑定组件
 * 绑定上级数据中的集合数据到组件上
 */
@ccclass('brief.ItemsSource')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/mvvm-mvvm-kuang-jia/itemssource')
@executeInEditMode
@menu('Brief/MVVM/ItemsSource')
export class ItemsSource extends DataContext {

    @property({
        type: Node,
        tooltip: '模板节点',
    })
    private template: Node = null;

    @property
    private _isSelected: boolean = false;
    @property({
        tooltip: '是否绑定选中项',
    })
    private get isSelected() {
        return this._isSelected;
    }
    private set isSelected(value) {
        this._isSelected = value;
    }

    @property
    private _bindingSelectedName = ""; // 挂载 @property 属性值保存到场景等资源文件中，用于 binding 数据恢复
    private _bindingSelectedEnums: { name: string, value: number }[] = [];
    private _bindingSelected = 0;
    /** 绑定选中项 */
    @property({
        type: Enum({}),
        tooltip: '绑定选中项',
        visible() {
            return this._isSelected;
        }
    })
    private get bindingSelected() {
        return this._bindingSelected;
    }
    private set bindingSelected(value) {
        this._bindingSelected = value;
        if (this._bindingSelectedEnums[value]) {
            this._bindingSelectedName = this._bindingSelectedEnums[value].name;
        }
    }

    //#region EDITOR
    protected selectedBinding() {
        super.selectedBinding();

        this.updateEditorBindingSelectedEnums();
    }

    private updateEditorBindingSelectedEnums() {
        // 获取绑定属性
        const newEnums = [];
        let dataList = decoratorData.getPropertyList(this.parent.bindingType);
        let data = dataList.find((item) => { return item.name === this._bindingName; });
        if (dataList && data) {
            let count = 0;
            dataList.forEach((item) => {
                // 仅显示对象类型
                if (item.type == data.type && item.kind != DataKind.Array) {
                    newEnums.push({ name: item.name, value: count++ });
                }
            });
        }
        // 设置绑定数据枚举
        this._bindingSelectedEnums = newEnums;
        CCClass.Attr.setClassAttr(this, 'bindingSelected', 'enumList', newEnums);

        // 如果绑定数据枚举为空，则警告
        if (this._bindingSelectedEnums.length === 0) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 ItemsSource 绑定未找到合适的数据（列表数据）`);
        }

        // 设置绑定数据枚举默认值
        if (this._bindingSelectedName !== '') {
            let findIndex = this._bindingSelectedEnums.findIndex((item) => { return item.name === this._bindingSelectedName; });
            if (findIndex === -1) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 ItemsSource 绑定 ${this._bindingSelectedName} 已经不存在`);
                // 如果只有一个枚举，就设置为默认值
                if (this._bindingSelectedEnums.length == 1) {
                    this.bindingSelected = 0;
                }
            }
            else {
                this.bindingSelected = findIndex;
            }
        }
        else {
            this.bindingSelected = 0;
        }
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
        this._bindDataKind = DataKind.Array;

        super.onLoad();

        if (EDITOR) return;

        this.initTemplate();

        // 初始化默认值
        if (this._data instanceof Array) {
            this._data.forEach((item, index) => {
                this.addItem(index, item);
            });
        }
    }

    protected onUpdateData() {
        // 数组类型数据，重新设置绑定属性（重新定位数组元素）
        // onLoad 中不能直接使用子类型 ItemSource，因为子类型 ItemSource 还未初始化
        if (this.parent.bindDataKind === DataKind.Array) {
            let index = this.parent.getItemIndex(this.node);
            this.upperDataContext = this.parent.dataContext[index];
        }
        else {
            this.upperDataContext = this.parent.dataContext;
        }

        if (!this.upperDataContext) return;

        this._data = this.upperDataContext[this._bindingName];
        // 设置观察函数
        observe((operation) => {
            this._data = this.upperDataContext[this._bindingName];

            if (!this._data) return;
            // 设置数组观察函数
            observe((operation) => {
                // 更新数组
                let length = this._data.length;
                if (!operation) return;

                let type = operation.type;
                if (type == 'add') {
                    let target = operation.target as any[];
                    this.addItem(target.indexOf(operation.value), operation.value);
                }
                else if (type == 'delete') {
                    this.deleteItem(operation.oldValue);
                }
            }, this);

            if (!operation) return;

            this._updateCallbackList.forEach((callback) => {
                callback();
            });
        }, this);

        this.cleanItems();
    }

    private _content: Node = null;
    private _template: Node = null;
    private _pool: NodePool = null;
    private initTemplate() {
        if (!this.template) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 ItemsSource 没有设置模板节点`);
            return;
        }
        this._template = this.template;
        this._content = this._template.parent;
        if (!this._pool) {
            this._pool = new NodePool(`${this.template.uuid}`);
        }
        this._pool.put(this._template);
    }

    private _nodeDataList: { node: Node, data: any }[] = [];
    private cleanItems() {
        if (this._content) {
            let children = this._content.children;
            for (let i = children.length - 1; i >= 0; i--) {
                let item = children[i];
                this._pool.put(item);
            }
        }

        if (this._nodeDataList && this._nodeDataList.length > 0) {
            this._nodeDataList.forEach((item) => {
                this._pool.put(item.node);
            });
        }
        this._nodeDataList = [];
    }

    private addItem(index: number, data: any) {
        if (index < 0) return;
        let node = this._pool.get();
        if (!node) {
            node = instantiate(this._template);
        }
        this._content.insertChild(node, index);
        this._nodeDataList.push({ node, data });

        if (this._isSelected) {
            node.off(Node.EventType.TOUCH_END);
            node.on(Node.EventType.TOUCH_END, () => {
                let proxy = reactive(data);
                this.parent.dataContext[this._bindingSelectedName] = proxy;
            }, this);
        }
    }

    private deleteItem(data: any) {
        let index = this._nodeDataList.findIndex((item) => {
            return item.data == data;
        });
        if (index < 0) return;

        let item = this._nodeDataList[index];
        this._pool.put(item.node);
        this._nodeDataList.splice(index, 1);
    }

    getItemIndex(node: Node) {
        let template = node;
        let index = -1;
        while (template) {
            index = this._content.children.indexOf(template);
            if (index >= 0) {
                return index;
            }
            if (template === this.node) {
                return -1;
            }
            template = template.parent;
        }
        return -1;
    }

}