/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Node, instantiate, NodePool } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
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
        this.bindDataKind = DecoratorDataKind.Array;

        super.onLoad();
        this.checkEditorComponent();
        if (EDITOR) return;

        this._context?.bind(this.path, this.onDataChange, this);
        this.initTemplate();
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
        this._template.active = false;
        this._content = this._template.parent;
        if (!this._pool) {
            this._pool = new NodePool(`${this.path}`);
        }
        this._pool.put(this._template);
    }

    private onDataChange(newVal: any, oldVal: any, path: string) {
        if (path !== this.path) return;

        // 只处理数组，不处理对象
        if (Object.prototype.toString.call(newVal) !== '[object Array]') return;

        let content = this._content;
        if (!content) return;

        // // 清空内容
        // let child = content.children;
        // for (let i = child.length - 1; i >= 0; i--) {
        //     let itemOld = child[i];
        //     itemOld.active = false;
        //     this._pool.put(itemOld);
        // }
        // this._itemMap.clear();
        // // 添加新内容
        // for (let i = 0; i < newVal.length; i++) {
        //     let itemNew = this._pool.get();
        //     if (!itemNew) {
        //         itemNew = instantiate(this._template);
        //     }
        //     this.setItemIndex(itemNew, i);
        //     itemNew.active = true;
        //     content.addChild(itemNew);
        // }

        // 删除多余项
        let child = content.children;
        for (let i = child.length - 1; i >= newVal.length; i--) 
        {
            let itemOld = child[i];
            itemOld.active = false;
            this._pool.put(itemOld);
        }

        // 更新索引
        child = content.children;
        this._itemMap.clear();
        for (let i = 0; i < child.length; i++) 
        {
            let item = child[i];
            this.setItemIndex(item, i);
        }

        // 添加新增项
        for (let i = child.length; i < newVal.length; i++)
        {
            let itemNew = this._pool.get();
            if (!itemNew) {
                itemNew = instantiate(this._template);
            }
            this.setItemIndex(itemNew, i);
            itemNew.active = true;
            content.addChild(itemNew);
        }

        this.onSimpleTypeDataChange(newVal, oldVal);

        // 通知内容变化（优化ScrollViewDynamic刷新）
        this.node.emit('ScrollViewDynamic.refresh', newVal, oldVal);
    }

    //#region Item With Index
    private _itemMap: Map<Node, number> = new Map();
    private setItemIndex(template: Node, index: number) {
        this._itemMap.set(template, index);
    }

    getItemsIndex(bindingNode: Node) {
        let template = bindingNode.parent;
        while (template) {
            if (this._itemMap.has(template)) {
                return this._itemMap.get(template);
            }
            if (template === this.node) {
                return -1;
            }
            template = template.parent;
        }
        return -1;
    }
    //#endregion

    //#region 通知基础类型列表
    private onSimpleTypeDataChange(newVal: any, oldVal: any) {
        if (this.isSimpleType()) {
            for (let i = 0; i < newVal.length; i++) {
                let path = `${this.path}.${i}.${this._bindingType}`;
                this._context.observable.onDataChange(path, newVal[i], oldVal[i]);
            }
        }
    }

    private _simpleTypeMap = {
        "String": true,
        "Number": true,
        "Boolean": true
    }

    /**
     * 是否是基础类型
     * @returns true:是基础类型, false:不是基础类型
     */
    isSimpleType() {
        return this._simpleTypeMap[this._bindingType];
    }
    //#endregion

}