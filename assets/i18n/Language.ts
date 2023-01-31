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
@executeInEditMode
@menu('Brief/I18n/Language')
export class Language extends Component {

    //#region ui
    @property({ visible: false })
    private language: string = "";
    @property({ displayName: 'Language', visible: true })
    private get _language() {
        return this.language;
    }
    private set _language(value) {
        this.language = value;
        this.updateLanguage();
    }

    @property({ visible: false })
    private model: I18nMode = I18nMode.DATA;
    @property({ displayName: 'Model', visible: true, type: Enum(I18nMode) })
    private get _model() {
        return this.model;
    }
    private set _model(value) {
        this.model = value;
        this.updateModel();
    }

    //#endregion
    
    private updateLanguage() {
        i18n.setLanguage(this.language);
    }

    private updateModel() {
        i18n.setMode(this.model);
    }
}