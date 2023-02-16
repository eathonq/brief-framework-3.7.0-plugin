/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Component, Node, Enum } from 'cc';
import { i18n, I18nMode } from './LanguageData';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 多语言管理 */
@ccclass('brief.Language')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/i18n-duo-yu-yan-guan-li/language')
@executeInEditMode
@menu('Brief/I18n/Language')
export class Language extends Component {

    //#region ui
    @property
    private _language: string = "";
    @property
    private get language() {
        return this._language;
    }
    private set language(value) {
        this._language = value;
        this.updateLanguage();
    }

    @property
    private _model: I18nMode = I18nMode.DATA;
    @property({ 
        type: Enum(I18nMode),
    })
    private get model() {
        return this._model;
    }
    private set model(value) {
        this._model = value;
        this.updateModel();
    }

    //#endregion
    
    private updateLanguage() {
        i18n.setLanguage(this._language);
    }

    private updateModel() {
        i18n.setMode(this._model);
    }
}