/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Component, Node, director } from 'cc';
const { ccclass, help, menu, property } = _decorator;

/** 测试接口 */
export interface ITest {
    /** 初始化后延迟启动测试（秒） */
    delay?: number;
    /** 初始化 */
    init?(): Promise<void>;
    /** 测试 */
    test(): Promise<void>;
    /** 刷新 */
    update?(dt: number): void;
}

/** 测试信息 */
type TestInfo = {
    /** 测试数据 */
    test: ITest;
    /** 排序 */
    sort: number;
    /** 自动测试超时（秒） */
    timeout?: number;
}

/** UI测试管理 */
@ccclass('brief.UITestManager')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/uitest/uitestmanager')
@menu('Brief/UITest/UITestManager')
export class UITestManager extends Component {

    //#region instance
    private static _instance: UITestManager = null;
    static get instance(): UITestManager {
        if (null == this._instance) {
            let scene = director.getScene();
            if (!scene) return null;
            this._instance = scene.getComponentInChildren(UITestManager);
            if (!this._instance) {
                let testNode = new Node("Test");
                scene.addChild(testNode);
                this._instance = testNode.addComponent(UITestManager);
            }
            director.addPersistRootNode(this._instance.node);
        }
        return this._instance;
    }
    //#endregion

    @property({
        tooltip: "是否开启测试"
    })
    private isOpen = false;

    @property({
        step: 0.1,
        tooltip: "启动测试延迟（秒）"
    })
    private delay = 0;

    @property({
        tooltip: "是否开启自动测试"
    })
    isAuto = false;

    @property({
        min: 0,
        step: 1,
        tooltip: "自动测试启动索引"
    })
    startIndex = 0;

    @property({
        step: 0.1,
        tooltip: "自动测试默认超时（秒）"
    })
    private timeout = 10;

    private _testList: TestInfo[] = [];
    private _currentTest: TestInfo = null;

    protected onLoad() {
        if (initFunc) {
            initFunc();
        }
        
        this.init();

        console.log("测试开始");

        if (this.isOpen) {
            if (this.delay > 0) {
                this.scheduleOnce(this.ready, this.delay);
            }
            else {
                this.ready();
            }
        }
    }

    private _timer = 0;
    protected update(dt: number): void {
        this._currentTest?.test.update?.(dt);

        if (this._timer > 0) {
            this._timer -= dt;
            if (this._timer <= 0) {
                this.onNextEvent();
            }
        }
    }

    private init() {
        this._testList = _testPool;
        this._testList.sort((a, b) => {
            return a.sort - b.sort;
        });

        let tagIndex = this._testList.findIndex(t => t.test.constructor.name == _tagTestName);
        this._testTag = tagIndex;
    }

    private _testTag = -1;
    private ready() {

        if (this.isAuto) {
            this.run(this.startIndex);
        }

        if (this._testTag >= 0) {
            this.run(this._testTag);
        }
        else {
            this.run();
        }
    }

    /** 运行测试 */
    private async run(index?: number) {
        if (null == index) {
            this._currentTest = this._testList[0];
        }
        else {
            if (index < this._testList.length) {
                this._currentTest = this._testList[index];
            }
            else {
                this._currentTest = null;
            }
        }

        if (this._currentTest) {
            await this._currentTest.test.init?.();
            await new Promise<void>(resolve => {
                this.scheduleOnce(() => {
                    resolve();
                }, this._currentTest.test.delay || 0);
            });
            if (this.isAuto) {
                this._timer = this._currentTest.timeout || this.timeout;
            }
            await this._currentTest.test.test();
            this._timer = 0;
        }
        else {
            console.log("测试结束");
        }
    }

    /** 重新运行测试 */
    private onRerunEvent() {
        if (this._currentTest) {
            this.run(this._testList.indexOf(this._currentTest));
        }
    }

    /** 运行下一个测试 */
    private onNextEvent() {
        if (null == this._currentTest) {
            this.run();
        }
        else {
            let index = this._testList.indexOf(this._currentTest);
            this.run(index + 1);
        }
    }

    /** 运行上一个测试 */
    private onPrevEvent() {
        if (null == this._currentTest) {
            this.run();
        }
        else {
            let index = this._testList.indexOf(this._currentTest);
            this.run(index - 1);
        }
    }
}

let _testPool: TestInfo[] = [];
let _tagTestName = "";
/**
 * 添加测试
 * @param ctor 测试类
 * @param isTag 默认启动标记
 * @param timeout 超时时间
 * @param sort 排序
 */
export function addTest<T extends ITest>(ctor: { new(): T }, isTag?: boolean, timeout?: number, sort = 1) {
    let test = new ctor();
    if (isTag) {
        _tagTestName = test.constructor.name;
    }
    _testPool.push({ test, sort, timeout });
}

let initFunc: Function = null;
/**
 * 设置测试初始化函数
 * @param init 
 */
export function setRootInit(init: Function) {
    initFunc = init;
}