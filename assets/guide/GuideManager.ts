/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Node, Component, director, Prefab, instantiate } from "cc";
import { EDITOR } from "cc/env";
import { config } from "../common/Configuration";
import { CommandData, GuideCommand, GuideMaskBase } from "./GuideCommand";
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

const GUIDE_MANAGER_DEBUG = true;

/** 引导步骤 */
type GuideStep = {
    /** 命令数据 */
    command: CommandData;
    /** 步骤名称 */
    name?: string;
}

/** 引导任务 */
export type GuideTask = {
    /** 任务名称 */
    name: string;
    /** 任务步骤 */
    steps: GuideStep[];
}

const LOCAL_GUIDE_KEY = "local_guide";

/** 引导管理 */
@ccclass('brief.GuideManager')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/guide-yin-dao-guan-li/guidemanager')
@executeInEditMode
@menu('Brief/Guide/GuideManager')
export class GuideManager extends Component {
    //#region instance
    private static _instance: GuideManager = null;
    static get instance(): GuideManager {
        if (this._instance == null) {
            let scene = director.getScene();
            if (!scene) return null;
            this._instance = scene.getComponentInChildren(GuideManager);
            if (!this._instance) {
                console.log("GuideManager is not found in scene");
                let newNode = new Node("GuideManager");
                scene.addChild(newNode);
                this._instance = newNode.addComponent(GuideManager);
            }
            director.addPersistRootNode(this._instance.node);
        }
        return this._instance;
    }
    //#endregion

    @property(Prefab)
    private guideMask: Prefab = null;

    protected onLoad() {
        this.initGuide();

        if (EDITOR) return;
        if(GuideManager._preTask && GuideManager._preTask.length > 0){
            this._tasks.push(...GuideManager._preTask);
            GuideManager._preTask = [];
        }
    }

    private _guideCommand: GuideCommand = null;
    private initGuide() {
        if (EDITOR) return;

        let parent = this.node.parent;
        let canvas = parent.getChildByName("Canvas");
        if (!canvas) {
            console.log("Canvas is not found in scene");
            return;
        }

        let guideMask = canvas.getComponentInChildren(GuideMaskBase);
        if (!guideMask) {
            let newNode = instantiate(this.guideMask);
            canvas.addChild(newNode);
            guideMask = newNode.getComponent(GuideMaskBase);
        }

        this._guideCommand = new GuideCommand(guideMask);

        this.loadLog();
    }

    private static  _preTask: GuideTask[] = [];
    /**
     * 预添加引导任务
     * @param task 引导任务
     */
    static preAddTask(task: GuideTask) {
        this._preTask.push(task);
    }

    private _tasks: GuideTask[] = [];
    /**
     * 添加引导任务
     * @param task 引导任务 
     */
    addTask(task: GuideTask) {
        this._tasks.push(task);
    }

    /**
     * 移除引导任务
     * @param taskName 任务名称 
     */
    removeTask(taskName: string) {
        for (let i = 0; i < this._tasks.length; i++) {
            if (this._tasks[i].name == taskName) {
                this._tasks.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 启动引导步骤
     * @param taskName 任务名称
     * @param onStepCallback 引导步骤回调
     */
    async startStep(taskName?:string, onStepCallback?: (step: GuideStep) => void) {
        if (this._tasks.length == 0) {
            console.warn("引导任务为空，请先添加引导任务！");
            return;
        }

        if (!taskName) {
            taskName = this._tasks[0].name;
        }

        let task = this._tasks.find(t => t.name == taskName);
        if (!task) {
            console.warn("引导任务不存在！");
            return;
        }

        let currentStepIndex = this._taskLog[task.name] || 0;

        while (currentStepIndex < task.steps.length) {
            let step = task.steps[currentStepIndex];
            if (GUIDE_MANAGER_DEBUG) console.log("开始引导步骤: " + step.name ?? currentStepIndex);
            this.saveLog(taskName, currentStepIndex);
            await this._guideCommand.doCommand(step.command);
            onStepCallback?.(step);
            currentStepIndex++;
        }

        if (GUIDE_MANAGER_DEBUG) console.log("引导结束");
    }

    /** 
     * 重置引导步骤
     * @param taskName 任务名称
     */
    resetStep(taskName?:string) {
        if (this._tasks.length == 0) {
            console.warn("引导任务为空，请先添加引导任务！");
            return;
        }

        if (!taskName) {
            taskName = this._tasks[0].name;
        }

        let task = this._tasks.find(t => t.name == taskName);
        if (!task) {
            console.warn("引导任务不存在！");
            return;
        }

        this.saveLog(taskName, 0);
    }

    //#region Task Log

    /** 保存进度 */
    private _taskLog: { [task:string]:number} = {};
    private saveLog(taskName:string, stepIndex:number) {
        this._taskLog[taskName] = stepIndex;
        config.setItem(LOCAL_GUIDE_KEY, this._taskLog);
    }

    /** 读取进度 */
    private loadLog() {
        // config.removeItem(LOCAL_GUIDE_KEY); // 清除本地存储
        this._taskLog = config.getItem(LOCAL_GUIDE_KEY, {});
    }
    //#endregion
}