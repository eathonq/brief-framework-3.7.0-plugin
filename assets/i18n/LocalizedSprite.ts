/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 09:04
 */

import { _decorator, Component, Node, Sprite } from 'cc';
import { EDITOR } from 'cc/env';
import { i18n } from './I18n';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/**
 * [i18n-LocalizedSprite]
 * i18n 本地化图片(支持Sprite)
 */
@ccclass('brief.LocalizedSprite')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/i18n/localizedsprite')
@executeInEditMode
@menu('Brief/I18n/LocalizedSprite')
export class LocalizedSprite extends Component {

    @property({
        tooltip: '绑定组件的名字',
        displayName: 'Component',
        readonly: true,
        serializable: false,
    })
    private componentName: string = Sprite.name;

    @property({
        tooltip: '组件上需要监听的属性',
        displayName: 'Property',
        readonly: true,
        serializable: false,
    })
    private componentProperty: string = "spriteFrame";

    @property
    private _watchPath: string = "";
    @property({
        visible() {
            return this.isWatchPath;
        },
        tooltip: '绑定路径'
    })
    private get watchPath() {
        return this._watchPath;
    }
    private set watchPath(value) {
        this._watchPath = value;
        this.resetValue();
    }

    @property({
        tooltip: '绑定路径',
        readonly: true,
        visible() {
            return !this.isWatchPath;
        }
    })
    private spriteFrameSet: string = "SpriteFrameSet";

    isWatchPath: boolean = true;

    /** 其它加载多语言图片方式 */
    languageSpriteHandler: (sprite: Sprite, language: string) => void;

    //#region EDITOR

    onRestore() {
        this.checkEditorComponent();
    }

    private checkEditorComponent() {
        if (EDITOR) {
            let com = this.node.getComponent(Sprite);
            if (!com) {
                console.warn('LocalizedSprite 组件必须挂载在 Sprite 组件上');
                return;
            }
        }
    }

    //#endregion

    protected onLoad() {
        this.checkEditorComponent();
        i18n.init();
        this.resetValue();
    }

    resetValue() {
        let sprite = this.node.getComponent(Sprite);
        if (!sprite) return;

        // 使用路径加载图片
        if (this.isWatchPath) {
            i18n.s(this._watchPath).then(spriteFrame => {
                if (spriteFrame) {
                    sprite.spriteFrame = spriteFrame;
                }
            });
        }
        // 使用其它方式加载图片
        else {
            if (this.languageSpriteHandler) {
                this.languageSpriteHandler(sprite, i18n.language);
            }
        }
    }
}