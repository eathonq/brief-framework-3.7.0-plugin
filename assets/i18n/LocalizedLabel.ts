/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 09:04
 */

import { _decorator, Component } from 'cc';
import { EDITOR } from 'cc/env';
import { i18n } from './LanguageData';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 组件检测数组 */
const COMP_ARRAY_CHECK = [
    //组件名、默认属性
    ['cc.Label', 'string'],
    ['cc.RichText', 'string'],
    ['cc.EditBox', 'string'],
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
        readonly: true,
    })
    private componentName: string = "";

    @property({
        tooltip: '组件上关联的属性',
        readonly: true,
    })
    private componentProperty: string = "";

    @property({ visible: false })
    private watchPath: string = "";

    @property({
        displayName: 'Watch Path',
        visible: true,
        tooltip: '绑定路径：\n#：参数开始标记;\n$：参数分隔符.',
    })
    private get _watchPath() {
        return this.watchPath;
    }
    private set _watchPath(value) {
        this.watchPath = value;
        this.resetValue();
    }

    //#region EDITOR
    onRestore() {
        this.checkEditorComponent();
    }

    private checkEditorComponent() {
        if (EDITOR) {
            let checkArray = COMP_ARRAY_CHECK;
            for (const item of checkArray) {
                if (this.node.getComponent(item[0])) {
                    this.componentName = item[0];
                    this.componentProperty = item[1];
                    break;
                }
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
        this.watchPath = path;
        this.resetValue();
    }

    /** 通过watchPath初始化值 */
    resetValue() {
        this.setComponentValue(i18n.t(this.watchPath));
    }

    /** 获取组件值 */
    private getComponentValue(): string {
        return this.node.getComponent(this.componentName)[this.componentProperty];
    }

    /** 设置组件值 */
    private setComponentValue(value: string) {
        this.node.getComponent(this.componentName)[this.componentProperty] = value;
    }

}