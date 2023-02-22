/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Node, Component, director, Camera, view, Size, Vec3, v3, tween } from "cc";
const { ccclass, help, menu, property } = _decorator;

/** 摄像机跟随组件（如果手动挂载，需要挂载在Camera上面） */
@ccclass('brief.CameraFollow')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/expand/camerafollow')
@menu('Brief/Expand/CameraFollow')
export class CameraFollow extends Component {
    //#region instance
    private static _instance: CameraFollow = null;
    static get instance(): CameraFollow {
        if (this._instance == null) {
            let scene = director.getScene();
            if (!scene) return null;
            let camera = scene.getComponentInChildren(Camera);
            if (!camera) return null;

            this._instance = camera.node.getComponent(CameraFollow);
            if (!this._instance)
                this._instance = camera.node.addComponent(CameraFollow);
        }
        return this._instance;
    }
    //#endregion

    protected update(deltaTime: number) {
        if (!this._target || this._isReset) return;

        this.moveNormal();
        //this.moveSmooth(deltaTime);
    }

    /**
     * 获取摄像机位置
     * @returns {Vec3}
     */
    getPosition(): Vec3 {
        return this.node.position;
    }

    private _target: Node = null;
    private _minX: number = 0;
    private _maxX: number = 0;
    private _minY: number = 0;
    private _maxY: number = 0;
    /**
     * 设置可视边界
     * @param mapSize 地图大小
     */
    setLimit(mapSize: Size) {
        // 摄像机边界计算
        let viewSize = view.getVisibleSize();
        this._maxX = (mapSize.width - viewSize.width) / 2;
        this._minX = -this._maxX;
        this._maxY = (mapSize.height - viewSize.height) / 2;
        this._minY = -this._maxY;
    }

    private _isReset = false;
    /**
     * 设置目标节点
     * @param target 目标节点
     * @param callback 目标切换动画回调
     */
    setTarget(target: Node, callback?: Function) {
        this._target = target;
        if (callback) {
            this._isReset = true;
            tween(this.node)
                .to(0.3, { position: this.safetyPos(target.position) })
                .call(() => {
                    this._isReset = false;
                    callback?.();
                })
                .start();
        }
        else {
            this.node.setPosition(this.safetyPos(this._target.position));
        }
    }

    /** 安全位置转换 */
    private safetyPos(pos: Vec3) {
        this._pos.x = pos.x;
        this._pos.y = pos.y;
        if (this._pos.x < this._minX) {
            this._pos.x = this._minX;
        }
        if (this._pos.x > this._maxX) {
            this._pos.x = this._maxX;
        }
        if (this._pos.y < this._minY) {
            this._pos.y = this._minY;
        }
        if (this._pos.y > this._maxY) {
            this._pos.y = this._maxY;
        }
        return this._pos;
    }

    private _pos: Vec3 = v3(0, 0, 0);
    /** 普通移动（同步目标节点） */
    private moveNormal() {
        this.node.position = this.safetyPos(this._target.position);
    }

    private _isCheckTime = 0;
    private _lastPos: Vec3 = v3(0, 0, 0);
    /** 平滑移动 */
    private moveSmooth(deltaTime: number) {
        this._isCheckTime += deltaTime;
        if (this._isCheckTime >= 0.1) {
            this._isCheckTime = 0;

            this.safetyPos(this._target.position);
            this._lastPos.x = this._pos.x;
            this._lastPos.y = this._pos.y;
        }

        let pos = this.node.position;
        // let x = (this._lastPos.x - pos.x) * deltaTime;
        // let y = (this._lastPos.y - pos.y) * deltaTime;
        this._pos.x = pos.x + (this._lastPos.x - pos.x) * deltaTime;
        this._pos.y = pos.y + (this._lastPos.y - pos.y) * deltaTime;
        this.node.position = this._pos;
    }
}