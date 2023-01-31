/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
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
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/i18n-duo-yu-yan-guan-li/localizedspriteframeset')
@executeInEditMode
@menu('Brief/I18n/LocalizedSpriteFrameSet')
export class LocalizedSpriteFrameSet extends Component {

    @property({
        type: [LocalizedSpriteFrameSetInfo],
        tooltip: '图片资源列表',
    })
    list: LocalizedSpriteFrameSetInfo[] = [];

    protected onLoad() {
        this.checkEditorComponent();
    }


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