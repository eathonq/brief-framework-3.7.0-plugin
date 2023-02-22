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
    /** 提示窗显示超时 */
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