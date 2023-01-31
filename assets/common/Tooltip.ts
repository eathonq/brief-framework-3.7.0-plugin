/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { ViewManager } from "../ui/ViewManager";

/** 提示框数据 */
export type TooltipData = {
    /** 内容 */
    content: string;
     /** 异步回调 */
     resolve?: () => void;
}

/** 提示框 */
export class Tooltip {
    private static timer: number;

    /**
     * 显示提示框
     * @param content 提示内容 
     * @param timeouts 超时时间，单位秒（默认为一直显示）
     * @param tooltip 指定提示框类型名称
     */
    static show(content: string, timeouts?: number, tooltip?: string) {
        let data: TooltipData = { content, resolve: ()=>{
            if (timeouts) {
                clearTimeout(Tooltip.timer);
                Tooltip.timer = null;
            }
        } };
        ViewManager.instance.showTooltip(tooltip, data);
        if (timeouts) {
            clearTimeout(Tooltip.timer);
            Tooltip.timer = setTimeout(() => {
                ViewManager.instance.closeTooltip(tooltip);
                Tooltip.timer = null;
            }, timeouts * 1000);
        }
    }

    /**
     * 显示提示框
     * @param name 提示框类型名称 
     * @param data 提示框数据
     */
    static tip(name: string, data?: any) {
        ViewManager.instance.showTooltip(name, data);
    }

    /**
     * 关闭提示框
     * @param name 提示框类型名称
     */
    static close(name: string) {
        ViewManager.instance.closeTooltip(name);
    }
}