/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Component, Node, Mask, UIOpacity, UITransform, Tween, Graphics, v3, tween, Input, EventTouch, Sprite } from 'cc';
import { GuideMaskBase } from './GuideCommand';
const { ccclass, property } = _decorator;

/** 引导管理器 Mask */
@ccclass('brief.GuideMask')
export class GuideMask extends GuideMaskBase {

    protected onLoad() {
        this.initMask();
    }

    private _mask: Mask = null;
    private _graphics: Graphics = null;
    private initMask() {
        this._mask = this.node.getComponent(Mask);
        this._graphics = this.node.getComponent(Graphics);

        this._mask.type = Mask.Type.GRAPHICS_RECT;
        this.node.active = false;
        this.node.getComponent(UIOpacity).opacity = 0;

        this.initBlockInputEventsWithTarget();
    }

    private initBlockInputEventsWithTarget() {
        let block = this.node.getComponentInChildren(Sprite).node;
        block.on(Input.EventType.TOUCH_START, (touch: EventTouch) => {
            if (!this._target) return;
            // 点击目标节点，放行点击
            let rect = this._target.getComponent(UITransform).getBoundingBoxToWorld();
            if (rect.contains(touch.getLocation())) {
                touch.preventSwallow = true;
            }
            else {
                touch.preventSwallow = false;
            }
        }, this);
        block.on(Input.EventType.TOUCH_END, (touch: EventTouch) => {
            if (!this._target) return;
            touch.preventSwallow = true;
        }, this);
        block.on(Input.EventType.TOUCH_MOVE, (touch: EventTouch) => {
            if (!this._target) return;
            touch.preventSwallow = true;
        }, this);
        block.on(Input.EventType.TOUCH_CANCEL, (touch: EventTouch) => {
            if (!this._target) return;
            touch.preventSwallow = true;
        }, this);
    }

    private _target: Node = null;
    private _tween: Tween<UIOpacity> = null;
    focusNode(target: Node) {
        if (!target) return;
        this._target = target;
        this.node.active = true;

        this._graphics.clear();
        // creator 3.7.0 有bug，getBoundingBoxToWorld() 会返回错误的值，所以这里要转换一下
        // let rect = this._target.getComponent(UITransform).getBoundingBoxToWorld();
        // let p = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(rect.x, rect.y));
        // this._graphics.fillRect(p.x, p.y, rect.width, rect.height);
        let rect = this._target.getComponent(UITransform).getBoundingBox();
        let rect_pt_world = this._target.parent.getComponent(UITransform).convertToWorldSpaceAR(v3(rect.x, rect.y));
        let p = this.node.getComponent(UITransform).convertToNodeSpaceAR(v3(rect_pt_world.x, rect_pt_world.y));
        this._graphics.fillRect(p.x, p.y, rect.width, rect.height);

        // 动画效果显示
        if (this._tween) this._tween.stop();
        this._tween = tween(this.node.getComponent(UIOpacity))
            .to(0.2, { opacity: 255 })
            .call(() => {
                this._tween = null;
            })
            .start();
    }

    clearFocus() {
        this.node.active = true;
        this._target = null;

        this._graphics.clear();
        this._graphics.fillRect(0, 0, 0, 0);

        // 动画效果隐藏
        if (this._tween) this._tween.stop();
        this._tween = tween(this.node.getComponent(UIOpacity))
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.node.active = false;
                this._tween = null;
            })
            .start();
    }
}