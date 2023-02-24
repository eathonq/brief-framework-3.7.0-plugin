/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Component, Node, Enum, JsonAsset, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { I18n, I18nMode } from './I18n';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 默认语言设置 */
@ccclass('brief.Language')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/i18n/language')
@executeInEditMode
@menu('Brief/I18n/Language')
export class Language extends Component {

    //#region ui
    @property
    private _defaultLanguage = "";
    private _languageEnums: { name: string, value: number }[] = [];
    private _language = 0;
    @property({
        type: Enum({}),
        tooltip: "默认语言",
    })
    get language() {
        return this._language;
    }
    private set language(value) {
        this._language = value;
        if (this._languageEnums[value]) {
            this._defaultLanguage = this._languageEnums[value].name;
            this.selectedLanguage();
        }
    }

    @property
    private _model: I18nMode = I18nMode.DATA;
    @property({ 
        type: Enum(I18nMode),
        tooltip: "多语言模式（编辑状态使用）",
    })
    private get model() {
        return this._model;
    }
    private set model(value) {
        this._model = value;
        this.selectedModel();
    }

    @property([JsonAsset])
    private _languages: JsonAsset[] = [];
    @property({
        type: [JsonAsset],
        tooltip: "默认语言数据列表",
        displayName: "Languages",
    })
    get languages() {
        return this._languages;
    }
    set languages(value) {
        this._languages = value;
        this.updateLanguages();
    }

    //#endregion

    //#region EDITOR
    onRestore() {
        this.checkEditorComponent();
    }

    private checkEditorComponent(){
        this.updateLanguages();
    }

    private updateLanguages() {
        let newLanguages = [];
        for (let i = 0; i < this._languages.length; i++) {
            let language = this._languages[i];
            I18n.instance.loadLanguageData(language.json);
            newLanguages.push(language.json["name"]);
        }
        this.updateLanguageEnums(newLanguages);
    }

    private updateLanguageEnums(languages: string[]) {
        const newEnums = [];
        for (let i = 0; i <languages.length; i++) {
            let language = languages[i];
            newEnums.push({ name: language, value: i });
        }
        this._languageEnums = newEnums;
        CCClass.Attr.setClassAttr(this, 'language', 'enumList', newEnums);

        // 重新设置默认语言
        if (this._defaultLanguage !== "") {
            let findIndex = this._languageEnums.findIndex((item) => {
                return item.name === this._defaultLanguage;
            });
            if (findIndex != -1) {
                this.language = findIndex;
                return;
            }
        }
        this.language = 0;
    }

    private selectedLanguage() {
        I18n.instance.setLanguageWithModel(this._defaultLanguage, this.model);
    }

    private selectedModel() {
        I18n.instance.setLanguageWithModel(this._defaultLanguage, this._model);
    }
    //#endregion
    protected onLoad() {
        if (EDITOR){
            this.checkEditorComponent();
            return;
        }
        
        // 设置默认语言
        for (let i = 0; i < this._languages.length; i++) {
            let language = this._languages[i];
            I18n.instance.loadLanguageData(language.json);
        }

        I18n.instance.init();
        if(I18n.instance.language == ""){
            I18n.instance.language = this._defaultLanguage;
        }

        // 设置默认显示
        I18n.instance.setLanguageWithModel(I18n.instance.language);
    }
}