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
import { ResourcesUtil } from "../cocos/ResourcesUtil";
import { LocalizedLabel } from "./LocalizedLabel";
import { LocalizedSprite } from "./LocalizedSprite";

const PARAMETER_MARK = '#';             // 参数开始标记
const PARAMETER_SPLIT = '$';            // 参数分隔符
const LOCAL_LANGUAGE_KEY = 'local_language';  // 本地语言 key
const LANGUAGE_DATA_PATH = 'i18n';     // 语言数据路径

/** 多语言数据 */
export type LanguageData = {
    /** 语言名称 */
    name: string;
    /** 语言数据 */
    data: {};
}

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
class I18n {
    //#region instance
    private static _instance: I18n;
    static get instance(): I18n {
        if (!this._instance) {
            this._instance = new I18n();
        }
        return this._instance;
    }
    //#endregion

    /** i18n显示模式 */
    private _i18nMode: I18nMode = I18nMode.DATA;

    private _language: string = "";
    /** 当前语言 */
    get language(): string {
        return this._language;
    }
    set language(value: string) {
        this._language = value;
        if (this._language !== value) {
            this.setLanguage(this._language);
        }
    }

    private _isInit: boolean = false;
    /** 初始化 */
    init() {
        if (this._isInit) return;
        this._isInit = true;

        if (EDITOR) return;

        let localLanguage = config.getItem(LOCAL_LANGUAGE_KEY);
        if (localLanguage) {
            this.setLanguage(localLanguage, false);
        }
    }

    /**
     * 设置语言数据
     * @param language 语言
     * @param mode 显示模式
     */
    setLanguageWithModel(language: string, mode: I18nMode = I18nMode.DATA) {
        this._i18nMode = mode;
        this._language = language;
        this.setLanguage(language, false);
    }

    /**
     * 设置语言
     * @param language 语言
     */
    private setLanguage(language: string, isSave = true): void {
        // 非编辑器模式下，保存本地语言
        if (!EDITOR && isSave) {
            config.setItem(LOCAL_LANGUAGE_KEY, language);
        }
        this._currentLanguageData = this._languages[language];
        this.updateSceneRenderers();
    }

    private _currentLanguageData: any = null;
    private current(watchPath: string): string {
        const searcher = watchPath.split('.');
        let data = this._currentLanguageData;
        if (!data) {
            return '';
        }
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
                return this.current(arr[0]);
            case I18nMode.DATA:
                break;
            default:
                break;
        }

        if (watchPath.indexOf(PARAMETER_MARK) < 0) {
            return this.current(watchPath);
        }
        else {
            let arr = watchPath.split(PARAMETER_MARK);
            return stringFormat.format(this.current(arr[0]), ...arr[1].split(PARAMETER_SPLIT));
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
        const allLocalizedLabels: LocalizedLabel[] = [];
        for (let i = 0; i < rootNodes.length; ++i) {
            let labels = rootNodes[i].getComponentsInChildren(LocalizedLabel);
            allLocalizedLabels.push(...labels);
        }
        for (let i = 0; i < allLocalizedLabels.length; ++i) {
            let label = allLocalizedLabels[i];
            if (!label.node.active) continue;
            label.resetValue();
        }

        // walk all nodes with localize sprite and update
        const allLocalizedSprites: LocalizedSprite[] = [];
        for (let i = 0; i < rootNodes.length; ++i) {
            let sprites = rootNodes[i].getComponentsInChildren(LocalizedSprite);
            allLocalizedSprites.push(...sprites);
        }
        for (let i = 0; i < allLocalizedSprites.length; ++i) {
            let sprite = allLocalizedSprites[i];
            if (!sprite.node.active) continue;
            sprite.resetValue();
        }
    }

    //#region 多语言json数据
    private _languages: { [key: string]: {} } = {};

    /**
     * 加载多语言数据
     * @param data 多语言数据
     */
    loadLanguageData(data: any) {
        if (data && data.name && data.data) {
            this._languages[data.name] = data.data;
        }
    }

    private _loadedLanguages: { [path: string]: boolean } = {};
    /** 
     * 加载多语言数据（自带重复加载检测）
     * @param path json路径（不包含后缀，相对路径从resources子目录算起）
     */
    async loadJsonLanguageData(path: string) {
        if (this._loadedLanguages[path]) return;

        let data = await ResourcesUtil.getJson<LanguageData>(path);
        if (data && data.name && data.data) {
            this._languages[data.name] = data.data;
            this._loadedLanguages[path] = true;
        }
    }
    //#endregion
}

/** i18n */
export const i18n = I18n.instance;