/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 09:04a
 */

import { _decorator, Component, Node, SpriteFrame, Sprite } from 'cc';
import { LocalizedSprite } from './LocalizedSprite';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

@ccclass('brief.LocalizedSpriteFrameSetInfo')
class LocalizedSpriteFrameSetInfo {
    @property({
        tooltip: '语言类型'
    })
    language: string = "";
    @property({
        tooltip: '图片资源',
        type: SpriteFrame,
    })
    spriteFrame: SpriteFrame = null;
}

@ccclass('brief.LocalizedSpriteFrameSet')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/i18n/localizedspriteframeset')
@executeInEditMode
@menu('Brief/I18n/LocalizedSpriteFrameSet')
export class LocalizedSpriteFrameSet extends Component {

    @property({
        type: [LocalizedSpriteFrameSetInfo],
        tooltip: '图片资源列表',
    })
    list: LocalizedSpriteFrameSetInfo[] = [];

    //#region EDITOR

    protected onDestroy() {
        this.checkEditorComponent(true);
    }

    private checkEditorComponent(isDestroy: boolean = false) {
        let localizedSprite = this.node.getComponent(LocalizedSprite);
        if (localizedSprite) {
            if (isDestroy) {
                localizedSprite.isWatchPath = true;
                localizedSprite.languageSpriteHandler = null;
            }
            else {
                localizedSprite.isWatchPath = false;
                localizedSprite.languageSpriteHandler = this.languageSprite.bind(this);
            }
        }
    }

    //#endregion

    protected onLoad() {
        this.checkEditorComponent();
    }

    private languageSprite(sprite: Sprite, language: string): void {
        let spriteFrame = this.getSpriteFrame(language);
        if (spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }
    }

    private getSpriteFrame(language: string): SpriteFrame {
        for (const info of this.list) {
            if (info.language === language) {
                return info.spriteFrame;
            }
        }
        return null;
    }
}