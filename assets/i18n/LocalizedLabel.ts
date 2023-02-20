/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 09:04
 */

import { _decorator, Component, Label, RichText, EditBox } from 'cc';
import { EDITOR } from 'cc/env';
import { i18n } from './LanguageData';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 组件检测数组 */
const COMP_ARRAY_CHECK: { type: any, property: string }[] = [
    { type: Label, property: 'string' },
    { type: RichText, property: 'string' },
    { type: EditBox, property: 'string' }
];

/**
 * [i18n-LocalizedLabel]
 * i18n 本地化文本(支持Label,RichText,EditBox)
 */
@ccclass('brief.LocalizedLabel')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/i18n-duo-yu-yan-guan-li/localizedlabel')
@executeInEditMode
@menu('Brief/I18n/LocalizedLabel')
export class LocalizedLabel extends Component {

    @property({
        tooltip: '绑定组件的名字',
        displayName: 'Component',
        readonly: true,
    })
    private componentName: string = "";

    @property({
        tooltip: '组件上关联的属性',
        displayName: 'Property',
        readonly: true,
    })
    private componentProperty: string = "";

    @property
    private _watchPath: string = "";
    @property({
        tooltip: '绑定路径：\n#：参数开始标记;\n$：参数分隔符.',
    })
    private get watchPath() {
        return this._watchPath;
    }
    private set watchPath(value) {
        this._watchPath = value;
        this.resetValue();
    }

    //#region EDITOR
    onRestore() {
        this.checkEditorComponent();
    }

    private checkEditorComponent() {
        if (EDITOR) {
            for (const item of COMP_ARRAY_CHECK) {
                if (this.node.getComponent(item.type)) {
                    this.componentName = item.type.name;
                    this.componentProperty = item.property;
                    break;
                }
            }

            if (this.componentName == "") {
                console.warn('LocalizedLabel 组件必须挂载在 Label,RichText,EditBox 上');
                return;
            }
    
        }
    }
    //#endregion

    protected onLoad() {
        this.checkEditorComponent();
        if (!i18n.ready) {
            i18n.init();
        }
        this.resetValue();
    }

    /**
         * 重置地址
         * @param path 地址 
         */
    resetPath(path: string) {
        this._watchPath = path;
        this.resetValue();
    }

    /** 通过watchPath初始化值 */
    resetValue() {
        this.setComponentValue(i18n.t(this._watchPath));
    }

    /** 设置组件值 */
    private setComponentValue(value: string) {
        switch (this.componentName) {
            case Label.name:
                this.node.getComponent(Label)[this.componentProperty] = `${value}`;
                break;
            case RichText.name:
                this.node.getComponent(RichText)[this.componentProperty] = `${value}`;
                break;
            case EditBox.name:
                this.node.getComponent(EditBox)[this.componentProperty] = `${value}`;
                break;
        }
    }

}