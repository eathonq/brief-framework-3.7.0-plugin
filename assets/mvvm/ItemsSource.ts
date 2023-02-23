/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-23 10:55
 */

import { _decorator, Node, instantiate, Enum, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../cocos/Locator';
import { observe, reactive } from '../common/ReactiveObserve';
import { DataContext } from "./DataContext";
import { decoratorData, DataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 
 * 数据集合绑定组件
 * 绑定上级数据中的集合数据到组件上
 */
@ccclass('brief.ItemsSource')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/mvvm/itemssource')
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
    get isSelected() {
        return this._isSelected;
    }
    private set isSelected(value) {
        this._isSelected = value;
        this.updateEditorBindingSelectedEnums();
    }

    @property
    private _bindingSelectedName = ""; // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
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
    get bindingSelected() {
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
        if (!this._isSelected) return;

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
            if (findIndex != -1) {
                this.bindingSelected = findIndex;
            }
            else {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 ItemsSource 绑定 ${this._bindingSelectedName} 已经不存在`);
                // 如果只有一个枚举，就设置为默认值
                if (this._bindingSelectedEnums.length == 1) {
                    this.bindingSelected = 0;
                }
            }
        }
    }
    //#endregion

    protected onLoad() {
        this.bindDataKind = DataKind.Array;
        super.onLoad();

        if (EDITOR) return;

        this.initTemplate();

        // 添加初始列表项
        if (this.dataContext instanceof Array) {
            this.dataContext.forEach((item, index) => {
                this.addItem(index, item);
            });
        }
    }

    protected onUpdateData() {
        super.onUpdateData();
        this.cleanItems();
    }

    protected onUpdateDataInternal() {
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
    }

    private _content: Node = null;
    private _template: Node = null;
    private initTemplate() {
        if (!this.template) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 ItemsSource 没有设置模板节点`);
            return;
        }
        this._template = this.template;
        this._content = this._template.parent;
        this._template.active = false;
        this._template.removeFromParent();
    }

    private _nodeDataList: { node: Node, data: any }[] = [];
    private cleanItems() {
        this._nodeDataList = [];
        if (this._content) {
            this._content.removeAllChildren();
        }
    }

    private addItem(index: number, data: any) {
        if (index < 0) return;
        let node = instantiate(this._template);
        node.active = true;
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
        item.node.removeFromParent();
        this._nodeDataList.splice(index, 1);
    }

    private getItemIndex(node: Node) {
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

    /**
     * 获取数据上下文
     * @param target 注册对象
     * @returns 数据上下文
     */
    getDataContextInRegister(target: any) {
        if (this._registry.has(target)) {
            let index = this.getItemIndex(target.node);

            // 基础类型数据，重新设置上级数据和绑定名称
            if (target._bindingName === target._bindingType || Number.isInteger(Number(target._bindingName))) {
                target._bindingName = `${index}`;
                return this._data;
            }

            return this._data[index];
        }
        return null;
    }
}