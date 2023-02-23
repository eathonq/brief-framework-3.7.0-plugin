/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { Component, director, Node } from "cc";
import { Locator } from "../cocos/Locator";
import { ViewManager } from "../cocos/ViewManager";

//#region Guide Data
export type ClickCommandData = {
    /** 
     * 按钮地址
     * @example
     * 1. 'Content/button1' 一级查询，等价于 node.getChildByName('Content').getChildByName('button1')
     * 2. 'Content>button2' 多级查询，等价于 node.getChildByName('Content').getChildByName('Item').getChildByName('button2')
     */
    path: string;
}

export type TooltipCommandData = {
    /** 提示窗显示内容 */
    content: string;
    /** 提示窗名称（类型） */
    type?: string;
    /** 提示窗显示超时（单位秒） */
    timeout?: number;
}

/** 引导步骤 */
export type GuideStep = {
    /** 步骤名称 */
    name?: string;
    click?: ClickCommandData;
    tooltip?: TooltipCommandData;
}

/** 引导任务 */
export type GuideTask = {
    /** 任务名称 */
    name: string;
    /** 任务步骤 */
    steps: GuideStep[];
}
//#endregion

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

/**
 * 引导命令
 * @param guideMask 引导遮罩
 * @info 用于执行引导步骤，引导步骤数据转换成引导命令操作
 */
export class GuideCommand {
    constructor(guideMask: GuideMaskBase) {
        this._guideMask = guideMask;
    }

    private _guideMask: GuideMaskBase = null;

    private async getNode(path: string) {
        const root = director.getScene();
        const node = await Locator.locateNode(root, path);
        if (!node) {
            console.error(`node not found: ${path}`);
        }
        return node;
    }

    async runStep(step: GuideStep) {
        if (step.click) {
            await this.doClick(step.click);
        }
        else if (step.tooltip) {
            // 默认数据设置
            // if(!step.tooltip.type){
            //     step.tooltip.type = "default";
            // }
            await this.doTooltip(step.tooltip);
        }
    }

    private async doClick(data: ClickCommandData) {
        const node = await this.getNode(data.path);
        if (!node) return;

        return new Promise<void>((resolve) => {
            this._guideMask.focusNode(node);
            node.once(Node.EventType.TOUCH_END, () => {
                this._guideMask.clearFocus();
                resolve();
            });
        });
    }

    private timer: any;
    private async doTooltip(data: TooltipCommandData) {
        return new Promise<void>((resolve) => {
            ViewManager.instance.showTooltip(data.type, {
                content: data.content, resolve: () => {
                    if (this.timer) {
                        clearTimeout(this.timer);
                        this.timer = null;
                    }
                    resolve();
                }
            });
            if (data.timeout) {
                clearTimeout(this.timer);
                this.timer = setTimeout(() => {
                    ViewManager.instance.closeTooltip(data.type);
                    this.timer = null;
                }, data.timeout * 1000);
            }
        });
    }
}