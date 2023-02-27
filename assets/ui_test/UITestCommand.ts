/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-23 16:20
 */

import { Button, director, EditBox, Label, ScrollView, Slider, Toggle, Vec2 } from "cc";
import { Locator } from "../common/Locator";
import { ViewManager } from "../common/ViewManager";

//#region UITest Data

/** 页面命令数据 */
export type ViewCommandData = {
    /** 页面名称 */
    name: string;
}

/** 标签命令数据 */
export type LabelCommandData = {
    /** 标签地址 */
    path: string;
    /** 标签文本（校验，支持正则） */
    text: string;
}

/** 点击命令数据 */
export type ClickCommandData = {
    /** 按钮地址 */
    path: string;
}

/** 输入命令数据 */
export type InputCommandData = {
    /** 输入框地址 */
    path: string;
    /** 输入内容 */
    text: string;
}

/** 滑动命令数据 */
export type SlideCommandData = {
    /** 滑动条地址 */
    path: string;
    /** 滑动值(0~1) */
    value: number;
}

/** 复选按钮数据 */
export type ToggleCommandData = {
    /** 复选按钮地址 */
    path: string;
    /** 是否选中 */
    checked: boolean;
}

export type ScrollCommandData = {
    /** 滚动视图地址 */
    path: string;
    /** 滚动值(像素值) */
    value: number;
    /** 滚动方向 */
    direction?: "horizontal" | "vertical";
}

/** 测试步骤 */
export type TestStep = {
    /** 步骤名称 */
    name?: string;
    delay?: number;
    view?: ViewCommandData;
    label?: LabelCommandData;
    click?: ClickCommandData;
    input?: InputCommandData;
    slide?: SlideCommandData;
    toggle?: ToggleCommandData;
    scroll?: ScrollCommandData;
}

/** 测试任务 */
export type TestTask = {
    /** 测试名称 */
    name: string;
    /** 测试步骤 */
    steps: TestStep[];
}

//#endregion

/**
 * UI测试命令
 */
export class UITestCommand {
    async runStep(step: TestStep) {
        if(step.delay){
            await this.delay(step.delay);
        }

        if (step.view) {
            await this.doView(step.view);
        }
        if (step.label) {
            await this.doLabel(step.label);
        }
        if (step.click) {
            await this.doClick(step.click);
        }
        if (step.input) {
            await this.doInput(step.input);
        }
        if (step.slide) {
            await this.doSlide(step.slide);
        }
        if (step.toggle) {
            await this.doToggle(step.toggle);
        }
        if (step.scroll) {
            await this.doScroll(step.scroll);
        }
    }

    private async delay(delay: number) {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                resolve();
            }, delay * 1000);
        });
    }

    private async getNode(path: string) {
        const root = director.getScene();
        const node = await Locator.locateNode(root, path);
        if (!node) {
            console.error(`node not found: ${path}`);
        }
        return node;
    }

    private async doView(data: ViewCommandData) {
        return new Promise<void>(async(resolve) => {
            ViewManager.instance.showView(data.name);
            await this.delay(0.1);  // 等待页面加载完成
            resolve();
        });
    }

    private async doLabel(data: LabelCommandData) {
        const node = await this.getNode(data.path);
        if (!node) return;

        return new Promise<void>(async (resolve) => {
            const label = node.getComponent(Label);
            if (label) {
                const text = label.string;
                if (text.match(data.text)) {
                    resolve();
                }
                else {
                    console.error(`text not match: ${data.path}, ${text} != ${data.text}`);
                    resolve();
                }
            }
            else {
                console.error(`not label: ${data.path}, label check failed`);
                resolve();
            }
        });
    }

    private async doClick(data: ClickCommandData) {
        const node = await this.getNode(data.path);
        if (!node) return;

        return new Promise<void>(async (resolve) => {
            const button = node.getComponent(Button);
            if (button) {
                button.node.emit(Button.EventType.CLICK);
                resolve();
            }
            else {
                console.error(`not button: ${data.path}, click failed`);
                resolve();
            }
        });
    }

    private async doInput(data: InputCommandData) {
        const node = await this.getNode(data.path);
        if (!node) return;

        return new Promise<void>(async (resolve) => {
            const editBox = node.getComponent(EditBox);
            if(editBox){
                editBox.string = data.text;
                editBox.node.emit(EditBox.EventType.TEXT_CHANGED);
                resolve();
            }
            else {
                console.error(`not editBox: ${data.path}, input failed`);
                resolve();
            }
        });
    }

    private async doSlide(data: SlideCommandData) {
        const node = await this.getNode(data.path);
        if (!node) return;

        return new Promise<void>(async (resolve) => {
            const slider = node.getComponent(Slider);
            if(slider){
                slider.progress = data.value;
                slider.node.emit('slide');
                resolve();
            }
            else {
                console.error(`not slider: ${data.path}, slide failed`);
                resolve();
            }
        });
    }

    private async doToggle(data: ToggleCommandData) {
        const node = await this.getNode(data.path);
        if (!node) return;

        return new Promise<void>(async (resolve) => {
            const toggle = node.getComponent(Toggle);
            if(toggle){
                toggle.isChecked = data.checked;
                resolve();
            }
            else {
                console.error(`not toggle: ${data.path}, toggle failed`);
                resolve();
            }
        });
    }

    private _v2: Vec2 = new Vec2();
    private async doScroll(data: ScrollCommandData) {
        const node = await this.getNode(data.path);
        if (!node) return;

        return new Promise<void>(async (resolve) => {
            const scrollView = node.getComponent(ScrollView);
            if(scrollView){
                if (data.direction == "horizontal") {
                    this._v2.set(data.value, 0);
                }
                else {
                    this._v2.set(0, data.value);
                }
                scrollView.scrollToOffset(this._v2, 0.1);

                // 滚动延迟
                await this.delay(0.1);

                resolve();
            }
            else {
                console.error(`not scrollView: ${data.path}, scroll failed`);
                resolve();
            }
        });
    }
}