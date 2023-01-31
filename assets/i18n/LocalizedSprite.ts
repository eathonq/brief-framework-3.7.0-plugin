/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Component, Node, Sprite } from 'cc';
import { EDITOR } from 'cc/env';
import { i18n } from './LanguageData';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/**
 * [i18n-LocalizedSprite]
 * i18n 本地化图片(支持Sprite)
 */
@ccclass('brief.LocalizedSprite')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/i18n-duo-yu-yan-guan-li/localizedsprite')
@executeInEditMode
@menu('Brief/I18n/LocalizedSprite')
export class LocalizedSprite extends Component {

    @property({
        tooltip: '绑定组件的名字',
        readonly: true,
    })
    private componentName: string = "";

    @property({
        tooltip: '组件上需要监听的属性',
        readonly: true,
    })
    private componentProperty: string = "";

    @property({ visible: false })
    private watchPath: string = "";

    @property({
        displayName: 'WatchPath',
        visible() {
            return this.isWatchPath;
        },
        tooltip: '绑定路径'
    })
    private get _watchPath() {
        return this.watchPath;
    }
    private set _watchPath(value) {
        this.watchPath = value;
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

    onRestore() {
        this.checkEditorComponent();
    }

    protected onLoad() {
        this.checkEditorComponent();
        if (!i18n.ready) {
            i18n.init();
        }
        this.resetValue();
    }

    private checkEditorComponent() {
        if (EDITOR) {
            let com = this.node.getComponent(Sprite);
            if (com) {
                this.componentName = "Sprite";
                this.componentProperty = "spriteFrame";
            }
        }
    }

    resetValue() {
        let sprite = this.node.getComponent(Sprite);
        if (!sprite || !sprite.isValid) return;

        // 使用路径加载图片
        if (this.isWatchPath) {
            i18n.s(this.watchPath).then(spriteFrame => {
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