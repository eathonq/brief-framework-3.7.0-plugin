/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 09:04
 */

import { _decorator, Component, Enum, EventTouch, Label } from "cc";
import { EDITOR } from "cc/env";
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 视图类型 */
export enum ViewType {
    /** 全屏视图 */
    View = 0,
    /** Dialog */
    Dialog = 1,
    /** 提示框 */
    Tooltip = 2,
}

/**
 * @example
 * protected onLoad() {
 *     // 注册视图事件
 *     this.node.on(ViewEvent, (state: ViewState, data: any) => {
 *         // TODO
 *     }, this);
 * }
 * // 通知视图事件
 * ViewManager.instance.show("ViewName", data);
 */
export const ViewEvent = "VIEW_EVENT";

/** 视图状态 */
export enum ViewState {
    /** 显示 */
    Show = 0,
    /** 隐藏 */
    Hide = 1,
    /** 关闭 */
    Close = 2,
    /** 数据通知 */
    Data = 3,
}

/** 视图基类 */
@ccclass('brief.ViewBase')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/cocos-ji-chu-zu-jian/viewbase')
@executeInEditMode
@menu('Brief/Cocos/ViewBase')
export class ViewBase extends Component {

    @property({
        tooltip: "视图名称",
    })
    viewName: string = "";

    @property({
        type: Enum(ViewType),
        tooltip: "视图类型:\nView: 全屏视图(显示将关闭其他视图);\nDialog: 对话框(显示在View上层)\nTooltip: 提示框(显示在最上层)",
    })
    viewType: ViewType = ViewType.View;

    @property({
        tooltip: "是否默认视图",
    })
    isDefault: boolean = false;

    @property({
        tooltip: "是否缓存（关闭不删除）",
    })
    isCache: boolean = false;

    //#region EDITOR
    onRestore() {
        this.checkEditorComponent(true);
    }

    private checkEditorComponent(isTitle = false) {
        if (this.viewName == "") {
            this.viewName = this.node.name;
        }
        if (isTitle) {
            let titleNode = this.node.getChildByName("Title");
            if (!titleNode) return;
            let title = titleNode.getComponent(Label);
            if (title) {
                title.string = this.viewName.toLocaleLowerCase();
            }
        }
    }

    //#endregion

    protected onLoad() {
        if(EDITOR){
            this.checkEditorComponent();
        }
    }

    protected doClose: (name: string, data?: any) => void = null;
    onCloseEvent(event: EventTouch, customEventData: string) {
        let name = this.viewName;
        let data = null;
        if (customEventData) {
            let params = customEventData.split("&");
            if (params[0].trim() != "") {
                name = params[0];
            }
            if (params[1] != undefined) {
                data = params[1];
            }
        }
        this.doClose?.(name, data);
    }

    protected doShow: (name: string, data?: any) => void = null;
    onShowEvent(event: EventTouch, customEventData: string) {
        let name = this.viewName;
        let data = null;
        if (customEventData) {
            let params = customEventData.split("&");
            if (params[0].trim() != "") {
                name = params[0];
            }
            if (params[1] != undefined) {
                data = params[1];
            }
        }
        this.doShow?.(name, data);
    }
}