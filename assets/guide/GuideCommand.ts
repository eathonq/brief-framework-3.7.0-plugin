/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { Component, director, Node } from "cc";
import { Locator } from "../cocos/Locator";
import { ViewManager } from "../cocos/ViewManager";
import { ClickCommandData, GuideStep, TooltipCommandData } from "./GuideTask";

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

    async doStep(step: GuideStep) {
        if(step.click){
            await this.doClick(step.click);
        }
        else if(step.tooltip){
            // 默认数据设置
            // if(!step.tooltip.type){
            //     step.tooltip.type = "default";
            // }
            await this.doTooltip(step.tooltip);
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
            ViewManager.instance.showTooltip(command.type, {
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
                    ViewManager.instance.closeTooltip(command.type);
                    this.timer = null;
                }, command.timeout);
            }
        });
    }
}