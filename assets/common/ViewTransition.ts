/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-05-15 17:43
 */

import { _decorator, Canvas, Component, director, Node, Sprite, UITransform, view } from 'cc';
import { SpriteTransition, SpriteTransitionState, SpriteTransitionType } from './SpriteTransition';
import { brief } from '../Brief';
import { EDITOR } from 'cc/env';
const { ccclass, help, menu, property } = _decorator;

const _image_width = 640;
const _image_height = 480;

/**
 * 视图过渡组件
 */
@ccclass('brief.ViewTransition')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/common/viewtransition')
@menu('Brief/Common/ViewTransition')
export class ViewTransition extends Component {

    //#region instance
    private static _instance: ViewTransition = null;
    static get instance() {
        if (!this._instance) {
            let scene = director.getScene();
            if (!scene) return null;
            this._instance = scene.getComponentInChildren(ViewTransition);
            if (!this._instance) {
                console.log("ViewTransition not found, create new one");
                let node = new Node("ViewTransition");
                scene.addChild(node);
                this._instance = node.addComponent(ViewTransition);
            }
        }
        return this._instance;
    }
    //#endregion

    @property({ type: SpriteTransition })
    spriteTransition: SpriteTransition = null;

    protected onLoad(): void {
        if (EDITOR) return;

        brief.viewTransition = this;

        this.autoAdjustScale();

        this.spriteTransition.node.active = false;
    }

    protected update(deltaTime: number) { }

    // 根据屏幕大小进行缩放
    private autoAdjustScale() {
        let trans = this.spriteTransition.node.getComponent(UITransform);
        trans.width = _image_width;
        trans.height = _image_height;
        let viewSize = view.getVisibleSize();

        let scaleWidth = viewSize.width / trans.width;
        let scaleHeight = viewSize.height / trans.height;

        this.spriteTransition.node.setScale(scaleWidth, scaleHeight)
    }

    // private getCanvasNode() {
    //     let scene = director.getScene();
    //     if (!scene) return null;
    //     let canvas = scene.getComponentInChildren(Canvas);
    //     if (!canvas) return null;
    //     return canvas.node;
    // }

    // private getCamera() {
    //     let scene = director.getScene();
    //     if (!scene) return null;
    //     let camera = scene.getComponentInChildren(Camera);
    //     if (!camera) return null;
    //     return camera;
    // }

    // private capture(width: number, height: number, camera?: Camera) {
    //     if (!camera) camera = this.getCamera();
    //     if (!camera) return null;
    //     let texture = new RenderTexture();
    //     texture.reset({
    //         width: width,
    //         height: height
    //     });
    //     camera.targetTexture = texture;
    //     director.root.frameMove(0);
    //     camera.targetTexture = null;
    //     let spriteFrame = new SpriteFrame();
    //     spriteFrame.reset({ texture });
    //     // spriteFrame.flipUVY = true; // test
    //     return spriteFrame;
    // }

    private _isRunning: boolean = false;
    /**
     * 运行过渡
     * @param enter 进入过渡类型 
     * @param exit 退出过渡类型
     * @param speed 过渡速度
     */
    async run(show: Function, enter: SpriteTransitionType = SpriteTransitionType.Random, exit: SpriteTransitionType = SpriteTransitionType.Random, speed: number = 5) {
        if (this._isRunning) return;
        this._isRunning = true;

        this.spriteTransition.node.active = true;
        await this.spriteTransition.run(enter, SpriteTransitionState.Show, speed);
        show?.();
        await this.spriteTransition.run(exit, SpriteTransitionState.Hide, speed);
        this.spriteTransition.node.active = false;

        this._isRunning = false;
    }

    /**
     * 进入过渡
     * @param type 过渡类型 
     * @param speed 过渡速度
     */
    async enter(type: SpriteTransitionType = SpriteTransitionType.Random, speed: number = 5) {
        if (this._isRunning) return;
        this._isRunning = true;

        this.spriteTransition.node.active = true;
        await this.spriteTransition.run(type, SpriteTransitionState.Show, speed);

        this._isRunning = false;
    }

    /**
     * 退出过渡
     * @param type 过渡类型 
     * @param speed 过渡速度
     */
    async exit(type: SpriteTransitionType = SpriteTransitionType.Random, speed: number = 5) {
        if (this._isRunning) return;
        this._isRunning = true;

        await this.spriteTransition.run(type, SpriteTransitionState.Hide, speed);
        this.spriteTransition.node.active = false;

        this._isRunning = false;
    }
}