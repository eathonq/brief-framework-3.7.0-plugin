/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 13:06
 */

import { _decorator, Node, instantiate, NodePool } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
import { observe, Operation } from '../common/ReactiveObserve';
import { DataContext } from "./DataContext";
import { DecoratorDataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 
 * 数据集合绑定组件
 */
@ccclass('brief.ItemsSource')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/mvvm-mvvm-kuang-jia/itemssource')
@executeInEditMode
@menu('Brief/MVVM/ItemsSource')
export class ItemsSource extends DataContext {

    @property({
        type: Node,
        tooltip: '模板节点'
    })
    private template: Node = null;

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
        this._bindDataKind = DecoratorDataKind.Array;

        super.onLoad();

        if (EDITOR) return;

        this.initTemplate();
    }

    protected onUpdateData() {
        this.upperDataContext = this.parent.dataContext;
        this._data = this.upperDataContext[this._bindingName];

        // 设置观察函数
        observe((() => {
            this._data = this.upperDataContext[this._bindingName];
            this._updateCallbackList.forEach((callback) => {
                callback();
            });

            // 设置数组观察函数
            observe(((operation: Operation) => {
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
            }).bind(this));

        }).bind(this));

        this.cleanItems();
    }

    private _content: Node = null;
    private _template: Node = null;
    private _pool: NodePool = null;
    private initTemplate() {
        if (!this.template) {
            console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 ItemsSource `, '没有设置模板节点');
            return;
        }
        this._template = this.template;
        this._content = this._template.parent;
        if (!this._pool) {
            this._pool = new NodePool(`${this.path}`);
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