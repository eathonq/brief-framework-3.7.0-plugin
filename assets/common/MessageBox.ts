/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { ViewManager } from "./ViewManager";

/** 消息框按钮 */
enum MessageBoxButtons {
    /* 消息框无按钮。 */
    None = 0,
    /* 消息框包含“确定”按钮。 */
    OK = 1,
    /* 消息框包含“确定”和“取消”按钮。 */
    OKCancel = 2,

    AbortRetryIgnore,
    YesNo,
    YesNoCancel,
}

/** 消息框结果 */
enum MessageBoxResult {
    /** Nothing */
    None = 0,
    /** 确定 */
    OK = 1,
    /** 取消 */
    Cancel = 2,
    /** 中止 */
    Abort = 3,
    /** 重试 */
    Retry = 4,
    /** 忽略 */
    Ignore = 5,

    Yes = 6,
    No = 7,
}

/** 消息框数据 */
export type MessageBoxData = {
    /** 内容 */
    content: string;
    /** 标题 */
    title?: string;
    /** 显示按钮 */
    buttons?: MessageBoxButtons;
    /** 异步回调 */
    resolve?: (result: MessageBoxResult) => void;
}

/** 消息框 */
export class MessageBox {
    /** 按钮类型 */
    static Buttons = MessageBoxButtons;

    /** 消息框结果 */
    static Result = MessageBoxResult;

    static Data: MessageBoxData;

    /**
     * 显示对话框
     * @param content 消息内容 
     * @param title 标题
     * @param buttons 按钮类型
     * @param dialog 指定弹窗类型名称
     * @returns Promise<MessageBoxResult>
     */
    static async show(content: string, title?: string, buttons?: MessageBoxButtons, dialog?: string) {
        if (buttons == undefined) buttons = MessageBoxButtons.OK;
        return new Promise<MessageBoxResult>((resolve) => {
            let data: MessageBoxData = { title, content, buttons, resolve };
            ViewManager.instance.showDialog(dialog, data);
        });
    }

    /**
     * 显示对话框
     * @param name 对话框类型名称 
     * @param data 对话框数据
     * @returns Promise<MessageBoxResult>
     */
    static async dialog(name: string, data?: any) {
        if (!data) data = {};
        return new Promise<MessageBoxResult>((resolve) => {
            data.resolve = resolve;
            ViewManager.instance.showDialog(name, data);
        });
    }

    /**
     * 关闭对话框
     * @param dialog 对话框类型名称 
     */
    static close(dialog: string) {
        ViewManager.instance.closeDialog(dialog);
    }
}