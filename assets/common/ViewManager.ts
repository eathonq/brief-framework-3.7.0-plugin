/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-06 09:54
 */

import { _decorator, Node, Component, director, Prefab, instantiate } from 'cc';
import { EDITOR } from 'cc/env';
import { brief } from '../Brief';
import { ViewBase, ViewEvent, ViewState } from './ViewBase';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 视图数据 */
class ViewData {
    /**
     * 视图数据
     * @param viewBase 视图基类
     * @param isCache 是否缓存（true:关闭时候不需要删除）
     * @param doClose 关闭回调
     * @param doShow 显示回调
     */
    constructor(viewBase: ViewBase, isCache: boolean, doClose?: (name: string, data?: any) => void, doShow?: (name: string, data?: any) => void) {
        this._isCache = isCache;
        this._viewBase = viewBase;

        if (doClose) {
            this._viewBase['doClose'] = doClose;
        }
        if (doShow) {
            this._viewBase['doShow'] = doShow;
        }
    }

    /** 视图名称 */
    get viewName() {
        return this._viewBase.viewName;
    }

    /** 视图基础数据 */
    private _viewBase: ViewBase = null;

    /** 缓存标识 */
    private _isCache: boolean = false;

    /**
     * 显示视图
     * @param data 数据
     */
    show(data?: any) {
        this._viewBase.node.active = true;
        this._viewBase.node.emit(ViewEvent, ViewState.Show, data);
    }

    /**
     * 隐藏视图
     * @param data 数据
     */
    hide(data?: any) {
        this._viewBase.node.emit(ViewEvent, ViewState.Hide, data);
        this._viewBase.node.active = false;
    }

    /**
     * 关闭视图
     * @param data 数据
     */
    close(data?: any) {
        this._viewBase.node.emit(ViewEvent, ViewState.Close, data);
        this._viewBase.node.active = false;
        if (!this._isCache) {
            this._viewBase.node.destroy();
        }
        this._viewBase = null;
    }

    /**
     * 数据通知
     * @param data 数据
     */
    data(data?: any) {
        this._viewBase.node.emit(ViewEvent, ViewState.Data, data);
    }
}

class DialogList {
    private dialogList: ViewData[] = [];

    getViewData(name: string): ViewData {
        return this.dialogList.find(v => v.viewName === name);
    }

    push(viewData: ViewData, data?: any) {
        if (!viewData) return;
        viewData.show(data);
        this.dialogList.push(viewData);
    }

    pop(viewData: ViewData, data?: any) {
        if (!viewData) return;
        viewData.close(data);
        this.dialogList.splice(this.dialogList.indexOf(viewData), 1);
    }
}

class TooltipList {
    private tooltipList: ViewData[] = [];

    getViewData(name: string): ViewData {
        return this.tooltipList.find(v => v.viewName === name);
    }

    push(viewData: ViewData, data?: any) {
        if (!viewData) return;
        viewData.show(data);
        this.tooltipList.push(viewData);
    }

    pop(viewData: ViewData, data?: any) {
        if (!viewData) return;
        viewData.close(data);
        this.tooltipList.splice(this.tooltipList.indexOf(viewData), 1);
    }
}

/** 视图栈(先进后出) */
class ViewStack {

    private viewList: ViewData[] = [];

    getViewData(name: string): ViewData {
        return this.viewList.find(v => v.viewName === name);
    }

    /**
     * 添加到栈顶（最后一个视图）
     * @param viewData 视图信息
     * @param data 数据
     */
    push(viewData: ViewData, data?: any): void {
        if (!viewData) return;

        // 关闭当前最后一个视图
        if (this.viewList.length > 0) {
            let current = this.viewList[this.viewList.length - 1];
            current.hide();
        }

        //添加到当前最后一个视图，并显示
        this.viewList.push(viewData);
        viewData.show(data);
    }

    /**
     * 添加到栈顶（最后一个视图），并替换当前最后一个视图
     * @param viewData 视图信息
     * @param data 数据
     */
    pushWithReplace(viewData: ViewData, data?: any): void {
        if (!viewData) return;

        // 关闭当前最后一个视图
        if (this.viewList.length > 0) {
            let current = this.viewList.pop();
            current.close();
        }

        //添加到当前最后一个视图，并显示
        this.viewList.push(viewData);
        viewData.show(data);
    }

    /**
     * 添加到栈顶（最后一个视图），并清空当前所有视图栈
     * @param viewData 视图信息
     * @param data 数据
     */
    pushWithRoot(viewData: ViewData, data?: any): void {
        if (!viewData) return;

        // 关闭当前所有所有视图
        while (this.viewList.length > 0) {
            let current = this.viewList.pop();
            current.close();
        }

        //添加到当前最后一个视图，并显示
        this.viewList.push(viewData);
        viewData.show(data);
    }

    /**
     * 弹出栈顶（最后一个视图）
     * @param data 数据
     */
    pop(data?: any) {
        // 关闭当前最后一个视图
        if (this.viewList.length > 0) {
            let current = this.viewList.pop();
            current.close(data);
        }

        // 显示当前最后一个视图
        if (this.viewList.length > 0) {
            let showView = this.viewList[this.viewList.length - 1];
            showView.show();
        }
    }

    /** 
     * 弹出直到某个视图
     * @param name 视图名称
     * @param data 数据
     */
    popTo(name: string, data?: any): boolean {
        if (!name) return false;

        let index = this.viewList.findIndex(v => v.viewName === name);
        if (index != -1) {
            // 已经是当前视图，不需要再操作
            if (index == this.viewList.length - 1) return true;

            // 关闭前面所有的视图
            while (this.viewList.length > index + 1) {
                let closeView = this.viewList.pop();
                closeView.close();
            }

            // 显示当前最后一个视图
            if (this.viewList.length > 0) {
                let showView = this.viewList[this.viewList.length - 1];
                showView.show(data);
            }

            return true;
        }

        return false;
    }

    /**
     * 移除某个视图
     * @param name 视图名称
     */
    remove(name: string, data?: any) {
        let index = this.viewList.findIndex(v => v.viewName === name);
        if (index != -1) {
            // 最后一个视图，弹出
            if (index == this.viewList.length - 1) return this.pop(data);

            // 不是最后一个视图，直接关闭
            let closeView = this.viewList.splice(index, 1);
            closeView[0].close(data);
        }
    }

    /**
     * 取出某个视图（不做任何操作，显示，关闭，隐藏等）
     * @param name 视图名称
     * @returns 视图信息
     */
    takeOut(name: string) {
        let index = this.viewList.findIndex(v => v.viewName === name);
        let isLast = index == this.viewList.length - 1;
        if (index != -1) {
            // 不是最后一个视图，直接关闭
            return this.viewList.splice(index, 1)[0];
        }
        return null;
    }
}

/** 视图管理 */
@ccclass('brief.ViewManager')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/common/viewmanager')
@executeInEditMode
@menu('Brief/Common/ViewManager')
export class ViewManager extends Component {
    //#region instance
    private static _instance: ViewManager = null;
    static get instance(): ViewManager {
        if (this._instance == null) {
            let scene = director.getScene();
            if (!scene) return null;
            this._instance = scene.getComponentInChildren(ViewManager);
            if (!this._instance) {
                console.log("ViewManager not found, create new one.");
                let newNode = new Node("ViewManager");
                scene.addChild(newNode);
                this._instance = newNode.addComponent(ViewManager);
            }
            director.addPersistRootNode(this._instance.node);
        }
        return this._instance;
    }
    //#endregion

    //#region 编辑字段
    @property({
        type: Node,
        tooltip: "视图内容节点",
    })
    private viewContent: Node = null;

    @property({
        tooltip: "默认视图",
        readonly: false,
    })
    private defaultView: string = "";

    @property({
        tooltip: "默认对话框",
        readonly: true,
    })
    private defaultDialog: string = "";

    @property({
        tooltip: "默认提示框",
        readonly: true,
    })
    private defaultTooltip: string = "";

    @property({
        tooltip: "默认视图索引（优先使用默认视图）",
        readonly: false,
        min: -1,
        step: 1,
    })
    private defaultIndex: number = 0;

    @property({
        type: [Prefab],
    })
    private _viewList: Prefab[] = [];
    @property({
        type: [Prefab],
        tooltip: "视图预制体列表",
    })
    get viewList(): Prefab[] {
        return this._viewList;
    }
    set viewList(value: Prefab[]) {
        this._viewList = value;
        this.checkEditorDefaultName();
    }
    //#endregion

    private viewTemplateMap: Map<string, { viewBase: ViewBase, node: Prefab | Node }> =
        new Map<string, { viewBase: ViewBase, node: Prefab | Node }>();

    private viewStack: ViewStack = new ViewStack();
    private dialogList: DialogList = new DialogList();
    private tooltipList: TooltipList = new TooltipList();

    // onRestore() {}

    protected onLoad(): void {
        if (EDITOR) return;

        brief.view = this;

        // 预制体添加到模板表
        for (let viewPrefab of this.viewList) {
            if (!viewPrefab) continue;
            let viewBase: ViewBase = viewPrefab.data.getComponent(ViewBase);
            if (viewBase) {
                this.viewTemplateMap.set(viewBase.viewName, { viewBase, node: viewPrefab });
            }
        }
        // 默认添加ViewContent子节点中为ViewBase的视图
        if (this.viewContent) {
            for (let node of this.viewContent.children) {
                this.setViewBaseNode(node);
            }
        }

        // 显示默认视图
        if (this.defaultView != "") {
            this.show(this.defaultView);
        }
        else {
            if (this.defaultIndex < this.viewList.length && this.defaultIndex >= 0) {
                this.show(this.viewList[this.defaultIndex].data.name);
            }
        }
    }

    private checkEditorDefaultName(): void {
        // this.defaultView = "";
        // this.defaultDialog = "";
        // this.defaultTooltip = "";

        if (this.viewList.length == 0) return;

        for (let viewPrefab of this.viewList) {
            if (viewPrefab == null) continue;
            let viewBase: ViewBase = viewPrefab.data.getComponent(ViewBase);
            if (viewBase && viewBase.isDefault) {
                if (viewBase.viewType == ViewBase.Type.View) {
                    this.defaultView = viewBase.viewName;
                }
                else if (viewBase.viewType == ViewBase.Type.Dialog) {
                    this.defaultDialog = viewBase.viewName;
                }
                else if (viewBase.viewType == ViewBase.Type.Tooltip) {
                    this.defaultTooltip = viewBase.viewName;
                }
            }
        }
    }

    private getDefaultName(viewType): string {
        for (let data of this.viewTemplateMap.values()) {
            if (data.viewBase.viewType === viewType && data.viewBase.isDefault) {
                return data.viewBase.viewName;
            }
        }

        return "";
    }

    private createViewData(name: string): ViewData {
        if (!name) return null;

        let viewTemplate = this.viewTemplateMap.get(name);
        if (!viewTemplate) return null;

        let viewData: ViewData = null;
        if (viewTemplate.node instanceof Prefab) {
            let newViewNode = instantiate(viewTemplate.node);
            let newViewBase = newViewNode.getComponent(ViewBase);
            this.viewContent.addChild(newViewNode);

            // 如果是缓存模式则重置模板为节点模板，下次直接使用节点模板
            if (newViewBase.isCache) {
                viewTemplate.node = newViewNode;
                viewTemplate.viewBase = newViewBase;
                viewData = new ViewData(newViewBase, true, this.close.bind(this), this.show.bind(this));
            }
            else {
                viewData = new ViewData(newViewBase, false, this.close.bind(this), this.show.bind(this));
            }
        }
        else {
            viewData = new ViewData(viewTemplate.viewBase, true, this.close.bind(this), this.show.bind(this));
        }

        return viewData;
    }

    /**
     * 更新视图在父类数组中的位置
     * Unknown < View < Dialog < Tooltip
     */
    private updateContentSiblingIndex(): void {
        let viewBaseArray: ViewBase[] = [];
        let childCount = this.viewContent.children.length;
        // 先设置 Unknown 节点的排序索引
        let siblingIndex = 0;
        for (let i = 0; i < childCount; i++) {
            let child = this.viewContent.children[i];
            let viewBase = child.getComponent(ViewBase);
            if (viewBase) {
                viewBaseArray.push(viewBase);
            }
            else {
                child.setSiblingIndex(siblingIndex);
                siblingIndex++;
            }
        }
        // View < Dialog < Tooltip 排序
        viewBaseArray.sort((a, b) => {
            return a.viewType - b.viewType;
        });
        // 更新节点顺序
        for (let i = 0; i < viewBaseArray.length; i++) {
            let viewBase = viewBaseArray[i];
            if (viewBase.node.parent) {
                viewBase.node.setSiblingIndex(i + siblingIndex);
            }
        }
    }

    /**
     * 获取视图类型
     * @param name 视图名称
     * @returns 视图类型
     */
    getViewType(name: string) {
        let viewData = this.viewTemplateMap.get(name);
        if (viewData) {
            return viewData.viewBase.viewType;
        }
        return null;
    }

    /**
     * 获取所有视图名称
     * @returns 所有视图名称
     */
    getAllViewNames(): string[] {
        let names: string[] = [];
        for (const key of this.viewTemplateMap.keys()) {
            names.push(key);
        }

        return names;
    }

    /**
     * 注册视图
     * @param viewBaseNode 视图节点(节点需要挂载ViewBase组件)
     */
    setViewBaseNode(viewBaseNode: Node): void {
        let viewBase: ViewBase = viewBaseNode.getComponent(ViewBase);
        if (viewBase) {
            viewBase.node.active = false;
            this.viewTemplateMap.set(viewBase.viewName, { viewBase, node: viewBaseNode });
        }
    }

    /**
     * 注册视图
     * @param name 视图名称
     * @param node 视图节点
     * @param type 视图类型
     */
    setViewNode(name: string, node: Node, type = ViewBase.Type.View) {
        let viewBase = node.getComponent(ViewBase);
        if (!viewBase) {
            viewBase = node.addComponent(ViewBase);
        }
        viewBase.viewName = name;
        viewBase.viewType = type;

        this.viewTemplateMap.set(name, { viewBase: viewBase, node: node });
    }

    /**
     * 显示视图
     * @param name 视图名称
     * @param data 数据
     */
    show(name: string, data?: any): void {
        let viewType = this.getViewType(name);
        if (viewType == null) return;
        switch (viewType) {
            case ViewBase.Type.View:
                this.showView(name, data);
                break;
            case ViewBase.Type.Dialog:
                this.showDialog(name, data);
                break;
            case ViewBase.Type.Tooltip:
                this.showTooltip(name, data);
                break;
            default:
                break;
        }
    }

    /**
     * 关闭视图
     * @param name 视图名称
     * @param data 数据
     */
    close(name: string, data?: any): void {
        let viewType = this.getViewType(name);
        if (viewType == null) return;
        switch (viewType) {
            case ViewBase.Type.View:
                this.closeView(name, data);
                break;
            case ViewBase.Type.Dialog:
                this.closeDialog(name, data);
                break;
            case ViewBase.Type.Tooltip:
                this.closeTooltip(name, data);
                break;
            default:
                break;
        }
    }

    /**
     * 显示视图（该视图已经存在则关闭之前所有视图显示该视图）
     * @param name 视图名称(不填显示默认视图) 
     * @param data 数据
     */
    showView(name?: string, data?: any): void {
        if (!name) name = this.getDefaultName(ViewBase.Type.View);
        if (!name) return;

        // 使用延迟，防止在onLoad中调用
        this.scheduleOnce(() => {
            if (this.viewStack.popTo(name, data)) {
                return;
            }
            else {
                let viewData = this.createViewData(name);
                if (!viewData) return;
                this.viewStack.push(viewData, data);
                this.updateContentSiblingIndex();
            }
        }, 0);
    }

    /**
     * 显示视图并替换当前视图（该视图已经存在则取出该视图显示替换）
     * @param name 视图名称
     * @param data 数据
     */
    showWithReplace(name: string, data?: any): void {
        if (!name) return;

        // 使用延迟，防止在onLoad中调用
        this.scheduleOnce(() => {
            let viewData = this.viewStack.takeOut(name);
            if (!viewData) {
                viewData = this.createViewData(name);
                if (!viewData) return;
            }
            this.viewStack.pushWithReplace(viewData, data);
            this.updateContentSiblingIndex();
        }, 0);
    }

    /**
     * 显示视图做为根视图（该视图已经存在则取出该视图做为根视图）
     * @param name 视图名称
     * @param data 数据
     */
    showWithRoot(name: string, data?: any): void {
        if (!name) return;

        // 使用延迟，防止在onLoad中调用
        this.scheduleOnce(() => {
            let viewData = this.viewStack.takeOut(name);
            if (!viewData) {
                viewData = this.createViewData(name);
                if (!viewData) return;
            }
            this.viewStack.pushWithRoot(viewData, data);
            this.updateContentSiblingIndex();
        }, 0);
    }

    /**
     * 视图后退（返回）
     * @param data 数据
     */
    backView(data?: any): void {
        this.viewStack.pop(data);
    }

    /**
     * 关闭视图
     * @param name 视图名称
     * @param data 数据
     */
    closeView(name: string, data?: any): void {
        this.viewStack.remove(name, data);
    }

    /**
     * 显示对话框
     * @param name 对话框名称(不填显示默认对话框)
     * @param data 数据
     */
    showDialog(name?: string, data?: any): void {
        if (!name) name = this.getDefaultName(ViewBase.Type.Dialog);
        if (!name) return;

        // 如果已经存在，则不再创建
        let viewData = this.dialogList.getViewData(name);
        if (viewData) return;

        viewData = this.createViewData(name);
        if (!viewData) return;

        this.dialogList.push(viewData, data);

        this.updateContentSiblingIndex();
    }

    /**
     * 关闭对话框
     * @param name 对话框名称(不填关闭默认对话框)
     * @param data 数据
     */
    closeDialog(name?: string, data?: any): void {
        if (!name) name = this.getDefaultName(ViewBase.Type.Dialog);
        if (!name) return;

        let viewData = this.dialogList.getViewData(name);
        if (viewData) {
            this.dialogList.pop(viewData, data);
        }
    }

    /**
     * 显示提示框
     * @param name 提示框名称(不填显示默认提示框)
     * @param data 数据
     */
    showTooltip(name?: string, data?: any): void {
        if (!name) name = this.getDefaultName(ViewBase.Type.Tooltip);
        if (!name) return;

        // 重复提示框，重新设置数据
        let viewData = this.tooltipList.getViewData(name);
        if (viewData) {
            viewData.data(data);
            return;
        }

        viewData = this.createViewData(name);
        if (!viewData) return;

        this.tooltipList.push(viewData, data);

        this.updateContentSiblingIndex();
    }

    /**
     * 关闭提示框
     * @param name 提示框名称(不填关闭默认提示框)
     * @param data 数据
     */
    closeTooltip(name?: string, data?: any): void {
        if (!name) name = this.getDefaultName(ViewBase.Type.Tooltip);
        if (!name) return;

        let viewData = this.tooltipList.getViewData(name);
        if (viewData) {
            this.tooltipList.pop(viewData, data);
        }
    }
}