/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { Component, director, Node } from "cc";
import { Locator } from "../cocos/Locator";
import { ViewManager } from "../cocos/ViewManager";

export class GuideMaskBase extends Component {
    /**
     * 聚焦节点
     * @param node 节点 
     */
    focusNode(node: Node) {
        console.log("focusNode is not implemented");
    }
    /**
     * 清除聚焦
     */
    clearFocus() {
        console.log("clearFocus is not implemented");
    }
}

/** 引导类型 */
export enum GuideType {
    /** 点击引导 */
    Click = 0,
    /** 
     * 提示引导
     * @info 该类型引导为异步操作，需要在引导结束后调用resolve()方法
     * @example
     * class TooltipGuide extends Component {
     *    private _data: TooltipData = null;
     *    protected onLoad() {
     *       this.node.on(ViewEvent, (state: ViewState, data: any) => {
     *          switch (state) {
     *             ...
     *             case ViewState.Close:
     *             case ViewState.Hide:
     *                this._data?.resolve?.();
     *                break;
     *          }
     *       }, this);
     *    }
     * }
     */
    Tooltip = 1,
    /** 滑动引导 */
    Slide = 3,
}

type ClickCommandData = {
    type: GuideType.Click;
    /** 
     * 按钮地址
     * @example
     * 1. 'Content/button1' 一级查询，等价于 node.getChildByName('Content').getChildByName('button1')
     * 2. 'Content>button2' 多级查询，等价于 node.getChildByName('Content').getChildByName('Item').getChildByName('button2')
     */
    path: string;
}

type TooltipCommandData = {
    type: GuideType.Tooltip;
    /** 提示窗名称（类型） */
    tooltip: string;
    /** 提示窗显示内容 */
    content: any;
    /** 提示窗显示超时 */
    timeout?: number;
}

type SlideCommandData = {
    type: GuideType.Slide;
    data: string;
}

export type CommandData = ClickCommandData | TooltipCommandData | SlideCommandData;

/**
 * 引导命令
 */
export class GuideCommand {
    constructor(guideMask: GuideMaskBase) {
        this._guideMask = guideMask;
    }

    private _guideMask: GuideMaskBase = null;

    async doCommand(command: any) {
        switch (command.type) {
            case GuideType.Click:
                await this.doClick(command);
                break;
            case GuideType.Tooltip:
                await this.doTooltip(command);
                break;
            case GuideType.Slide:
                await this.doSlide(command);
                break;
        }
    }

    private async doClick(command: ClickCommandData) {
        return new Promise<void>(async (resolve, reject) => {
            let root = director.getScene();
            let node = await Locator.locateNode(root, command.path);
            if (node) {
                this._guideMask.focusNode(node);
                node.once(Node.EventType.TOUCH_END, () => {
                    this._guideMask.clearFocus();
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }

    private timer: any;
    private async doTooltip(command: TooltipCommandData) {
        return new Promise<void>(async (resolve, reject) => {
            ViewManager.instance.showTooltip(command.tooltip, {
                content: command.content, resolve: () => {
                    if (this.timer) {
                        clearTimeout(this.timer);
                        this.timer = null;
                    }
                    resolve();
                }
            });
            if (command.timeout) {
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    ViewManager.instance.closeTooltip(command.tooltip);
                    this.timer = null;
                }, command.timeout);
            }
        });
    }

    private async doSlide(command: SlideCommandData) {
        return new Promise<void>(async (resolve, reject) => {
            // TODO
            resolve();
        });
    }
}