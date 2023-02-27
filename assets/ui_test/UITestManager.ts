/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-23 16:20
 */

import { _decorator, Component, Node, director, JsonAsset } from 'cc';
import { EDITOR } from 'cc/env';
import { ResourcesUtil } from '../cocos/ResourcesUtil';
import { TestTask, UITestCommand } from './UITestCommand';
const { ccclass, help, menu, property } = _decorator;

const TEST_MANAGER_DEBUG = true;

/** UI测试管理 */
@ccclass('brief.UITestManager')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/ui-test/uitestmanager')
@menu('Brief/UITest/UITestManager')
export class UITestManager extends Component {
    // //#region instance
    // private static _instance: UITestManager = null;
    // static get instance(): UITestManager {
    //     if (null == this._instance) {
    //         let scene = director.getScene();
    //         if (!scene) return null;
    //         this._instance = scene.getComponentInChildren(UITestManager);
    //         if (!this._instance) {
    //             console.log("UITestManager not found, create new one");
    //             let testNode = new Node("UITestManager");
    //             scene.addChild(testNode);
    //             this._instance = testNode.addComponent(UITestManager);
    //         }
    //         director.addPersistRootNode(this._instance.node);
    //     }
    //     return this._instance;
    // }
    // //#endregion

    // @property(JsonAsset)
    // private test: JsonAsset = null;

    @property({
        tooltip: "测试任务json路径（不包含后缀，相对路径从resources子目录算起）",
    })
    private test: string = "";

    @property({
        tooltip: "是否在加载时自动执行测试任务",
    })
    private startOnLoad: boolean = false;

    protected onLoad() {
        if (EDITOR) return;

        if (this.test && this.startOnLoad) {
            // let data = this.test.json as TestTask;
            // if (data && data.name && data.steps) {
            //     this.startTest(data);
            // }
            this.loadJsonTask(this.test).then((data) => {
                if (data) {
                    this.startTest(data);
                }
            });
        }
    }

    private _uiTestCommand: UITestCommand = new UITestCommand();
    async startTest(task: TestTask) {
        if (!task) {
            console.log("test task is null.");
            return;
        }

        let stepIndex = 0;
        while (stepIndex < task.steps.length) {
            let step = task.steps[stepIndex];
            if (TEST_MANAGER_DEBUG) console.log(`step:${step.name ?? stepIndex}.`);
            await this._uiTestCommand.runStep(step);
            stepIndex++;
        }

        if (TEST_MANAGER_DEBUG) console.log("test finished.");
    }

    /**
     * 加载测试任务
     * @param path json路径（不包含后缀，相对路径从resources子目录算起）
     */
    async loadJsonTask(path: string): Promise<TestTask> {
        let data = await ResourcesUtil.getJson<TestTask>(path);
        if (data && data.name && data.steps) {
            return data;
        }
        return null;
    }
}