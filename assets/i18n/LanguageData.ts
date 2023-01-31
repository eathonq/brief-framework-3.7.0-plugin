/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { director, SpriteFrame } from "cc";
import { EDITOR } from "cc/env";
import { config } from "../common/Configuration";
import { stringFormat } from "../common/StringFormat";
import { ResourcesUtil } from "../common/ResourcesUtil";
import { LocalizedLabel } from "./LocalizedLabel";
import { LocalizedSprite } from "./LocalizedSprite";

const PARAMETER_MARK = '#';             // 参数开始标记
const PARAMETER_SPLIT = '$';            // 参数分隔符
const DEFAULT_LANGUAGE = 'zh';          // 默认语言
const LOCAL_LANGUAGE_KEY = 'language';  // 本地语言 key

const LANGUAGE_DATA_PATH = 'i18n';     // 语言数据路径

/** i18n显示模式 */
export enum I18nMode {
    /** 解析数据 */
    DATA = 0,
    /** 路径数据 */
    PATH = 1,
    /** 模板数据 */
    TEMPLATE = 2
}

/** 多语言数据管理 */
class LanguageData {
    //#region instance
    private static _instance: LanguageData;
    static get instance(): LanguageData {
        if (!this._instance) {
            this._instance = new LanguageData();
        }
        return this._instance;
    }
    //#endregion

    private _i18nMode: I18nMode = I18nMode.DATA;
    /** i18n显示模式 */
    get i18nMode(): I18nMode {
        return this._i18nMode;
    }

    private _language: string = "";
    /** 当前语言 */
    get language(): string {
        return this._language;
    }

    /** 是否准备标识 */
    get ready() {
        return this._init;
    }
    /** 根据本地语言标识初始化 */
    private _init = false;
    init() {
        if (this._init) return;
        this._init = true;

        let localLanguage = DEFAULT_LANGUAGE;
        if (!EDITOR) {
            localLanguage = config.getItem(LOCAL_LANGUAGE_KEY, DEFAULT_LANGUAGE);
        }
        this.setLanguage(localLanguage);
    }

    /**
     * 设置显示模式
     * @param mode 显示模式
     */
    setMode(mode: I18nMode): void {
        if (this._i18nMode === mode) return;
        this._i18nMode = mode;

        this.updateSceneRenderers();
    }

    /**
     * 设置语言
     * @param language 语言
     */
    setLanguage(language: string): void {
        if (this._language == language && this._i18nMode == I18nMode.DATA) return;

        this._i18nMode = I18nMode.DATA;

        if (language.trim() === '') {
            language = DEFAULT_LANGUAGE;
        }

        if (this._language != language) {
            this._language = language;
            if (!EDITOR) {
                config.setItem(LOCAL_LANGUAGE_KEY, language);
            }
        }

        this.updateSceneRenderers();
    }

    /**
     * 获取多语言配置数据
     * @param watchPath 配置路径
     * @returns 多语言配置数据
     */
    private getLanguage(watchPath: string): string {
        const win: any = window;
        if (!win.languages) return watchPath;
        const searcher = watchPath.split('.');
        let data = win.languages[this._language];
        if (!data) return '';
        for (let i = 0; i < searcher.length; i++) {
            data = data[searcher[i]];
            if (!data) {
                return '';
            }
        }
        return data || '';
    }

    /**
     * 获取多语言文本
     * @param watchPath 文本路径 #参数开始标记, $参数分隔符
     * @returns 多语言文本
     * @example
     * i18n.t('title_1#10$20$30');
     */
    t(watchPath: string): string {
        if (watchPath.trim() === '') return;

        switch (this._i18nMode) {
            case I18nMode.PATH:
                return watchPath;
            case I18nMode.TEMPLATE:
                let arr = watchPath.split(PARAMETER_MARK);
                return this.getLanguage(arr[0]);
            case I18nMode.DATA:
                break;
            default:
                break;
        }

        if (watchPath.indexOf(PARAMETER_MARK) < 0) {
            return this.getLanguage(watchPath);
        }
        else {
            let arr = watchPath.split(PARAMETER_MARK);
            return stringFormat.format(this.getLanguage(arr[0]), ...arr[1].split(PARAMETER_SPLIT));
        }
    }

    /**
     * 获取多语言图片
     * @param watchPath 图片路径 
     * @param formate 加载格式 spriteFrame 或者 texture (默认 spriteFrame)
     * @returns Promise<SpriteFrame> 多语言图片
     */
    async s(watchPath: string, formate = "spriteFrame"): Promise<SpriteFrame> {
        if (watchPath.trim() === '') return null;
        if (EDITOR) return null;
        return ResourcesUtil.getSpriteFrame(`${LANGUAGE_DATA_PATH}/${this._language}/${watchPath}`, formate);
    }

    /** 更新场景渲染器（刷新语言） */
    private updateSceneRenderers() {
        const rootNodes = director.getScene()!.children;
        // walk all nodes with localize label and update
        const allLocalizedLabels: any[] = [];
        for (let i = 0; i < rootNodes.length; ++i) {
            //let labels = rootNodes[i].getComponentsInChildren('brief.LocalizedLabel');
            let labels = rootNodes[i].getComponentsInChildren(LocalizedLabel);
            Array.prototype.push.apply(allLocalizedLabels, labels);
        }
        for (let i = 0; i < allLocalizedLabels.length; ++i) {
            let label = allLocalizedLabels[i];
            if (!label.node.active) continue;
            label.resetValue();
        }

        // walk all nodes with localize sprite and update
        const allLocalizedSprites: any[] = [];
        for (let i = 0; i < rootNodes.length; ++i) {
            //let sprites = rootNodes[i].getComponentsInChildren('brief.LocalizedSprite');
            let sprites = rootNodes[i].getComponentsInChildren(LocalizedSprite);
            Array.prototype.push.apply(allLocalizedSprites, sprites);
        }
        for (let i = 0; i < allLocalizedSprites.length; ++i) {
            let sprite = allLocalizedSprites[i];
            if (!sprite.node.active) continue;
            sprite.resetValue();
        }
    }
}

/** i18n */
export const i18n = LanguageData.instance;

// 供插件查询当前语言使用
// const win = window as any;
// win._languageData = {
//     get language() {
//         return i18n.language;
//     },
//     init(lang: string) {
//         i18n.setLanguage(lang);
//     }
// };
