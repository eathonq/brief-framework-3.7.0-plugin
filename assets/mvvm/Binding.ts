/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-15 18:45
 */

import { _decorator, Node, EditBox, Component, Enum, Toggle, Slider, PageView, Sprite, ToggleContainer, EventHandler, Button, CCClass, Label, RichText, ProgressBar } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
import { observe, unobserve } from '../common/ReactiveObserve';
import { ResourcesUtil } from '../common/ResourcesUtil';
import { DataContext } from "./DataContext";
import { decoratorData, DataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 组件检测数组 */
const COMP_ARRAY_CHECK: { type: any, property: string, data_kind: DataKind[] }[] = [
    { type: Label, property: 'string', data_kind: [DataKind.String, DataKind.Number, DataKind.Boolean] },
    { type: RichText, property: 'string', data_kind: [DataKind.String, DataKind.Number, DataKind.Boolean] },
    { type: EditBox, property: 'string', data_kind: [DataKind.String, DataKind.Number, DataKind.Boolean] },
    { type: Toggle, property: 'isChecked', data_kind: [DataKind.Boolean] }, // Toggle继承于Button，所以必须放在Button前面
    { type: Button, property: 'click', data_kind: [DataKind.Function] },
    { type: Slider, property: 'progress', data_kind: [DataKind.Number] },
    { type: ProgressBar, property: 'progress', data_kind: [DataKind.Number] },
    { type: PageView, property: 'CurrentPageIndex', data_kind: [DataKind.Number] },
    { type: Sprite, property: 'SpriteFrame', data_kind: [DataKind.String] },
    { type: ToggleContainer, property: 'CheckedIndex', data_kind: [DataKind.Number] }, // 仅支持 allowSwitchOff = false
];

/** 绑定模式 */
export enum BindingMode {
    /** 双向绑定(View<=>Model)，导致对绑定源或目标属性(UI)的更改自动更新另一个。 */
    TwoWay = 0,
    /** 单向绑定(View<-Model)，当绑定源改变时更新绑定目标属性(UI)。 */
    OneWay = 1,
    /** 一次绑定(View<-Model)，当绑定源改变时更新绑定目标属性(UI)，仅通知一次。 */
    OneTime = 2,
    /** 单向绑定(View->Model)，当绑定目标属性(UI)改变时更新绑定源。 */
    OneWayToSource = 3,
}

/** 
 * 数据绑定组件
 * 绑定上级数据中的基础类型数据（String、Number、Boolean、Function）到组件上
 */
@ccclass('brief.Binding')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/mvvm-mvvm-kuang-jia/binding')
@executeInEditMode
@menu('Brief/MVVM/Binding')
export class Binding extends Component {

    /** 绑定组件的名字 */
    @property({
        tooltip: '绑定组件的名字',
        displayName: 'Component',
        readonly: true,
    })
    private componentName: string = "";

    /** 组件上需要监听的属性 */
    @property({
        tooltip: '组件上需要监听的属性',
        displayName: 'Property',
        readonly: true,
    })
    private componentProperty: string = "";

    /** 组件上需要监听的属性的数据类型 */
    private componentCheckTypes: DataKind[] = [];

    /** 数据上下文路径 */
    @property(DataContext)
    private _parent: DataContext = null;
    @property({
        type: DataContext,
        displayName: 'DataContext',
        tooltip: '数据上下文',
    })
    get parent() {
        return this._parent;
    }
    private set parent(value) {
        this._parent = value;
        this.updateEditorBindingEnums();
    }

    @property
    private _bindingMode = -1; // 挂载 @property 属性值保存到场景等资源文件中，用于 binding 数据恢复
    private _modeEnums: { name: string, value: number, mode: BindingMode }[] = [];
    private _mode = 0;
    /** 绑定模式 */
    @property({
        type: Enum({}),
        tooltip: '绑定模式:\n TwoWay: 双向绑定(Model<->View);\n OneWay: 单向绑定(Model->View);\n OneTime: 一次单向绑定(Model->View);\n OneWayToSource: 单向绑定(Model<-View)。',
    })
    get mode() {
        return this._mode;
    }
    private set mode(value) {
        this._mode = value;
        if (this._modeEnums[value]) {
            this._bindingMode = this._modeEnums[value].mode;
        }
    }

    @property
    private _bindingType = "";  // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    get bindingType() {
        return this.bindingType;
    }

    @property
    private _bindingName = ""; // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    get bindingName() {
        return this._bindingName;
    }

    private _bindingEnums: { name: string, value: number, type: string }[] = [];
    private _binding = 0;
    /** 绑定属性 */
    @property({
        type: Enum({}),
        tooltip: '绑定属性',
    })
    get binding() {
        return this._binding;
    }
    private set binding(value) {
        this._binding = value;
        if (this._bindingEnums[value]) {
            this._bindingName = this._bindingEnums[value].name;
            this._bindingType = this._bindingEnums[value].type;
            this.selectedBinding();
        }
    }

    /** 绑定方法自定义参数 */
    @property({
        tooltip: '绑定方法自定义参数',
        visible() {
            return this.componentName == Button.name;
        },
    })
    private customEventData: string = "";

    /** 上一级绑定数据 */
    private _upperData: any = null;

    /** 当前绑定数据 */
    protected _data: any = null;
    /** 当前绑定数据 */
    get dataContext() {
        return this._data;
    }

    //#region EDITOR
    onRestore() {
        this._parent = null;
        this.checkEditorComponent();
    }

    private checkEditorComponent() {
        this.initParentDataContext();

        // 上下文数据异常，则不继续执行
        if (!this._parent) return;

        // 组件查找
        this.componentName = "";
        this.componentProperty = "";
        this.componentCheckTypes = [];
        for (const item of COMP_ARRAY_CHECK) {
            if (this.node.getComponent(item.type)) {
                this.componentName = item.type.name;
                this.componentProperty = item.property;
                this.componentCheckTypes = item.data_kind;
                break;
            }
        }
        if (this.componentName == "") {
            console.warn("Binding 组件未找到对应的组件");
            return;
        }

        // 组件默认设置
        this.defaultEditorComponent();
        this.updateEditorModeEnums();
        this.updateEditorBindingEnums();
    }

    /** 默认组件设置 */
    private defaultEditorComponent() {
        switch (this.componentName) {
            case ToggleContainer.name:
                const container = this.node.getComponent(ToggleContainer);
                container.allowSwitchOff = false;
                break;
            default:
                break;
        }
    }

    /** 更新绑定模式枚举 */
    private updateEditorModeEnums() {
        const newEnums = [];
        let count = 0;
        switch (this.componentName) {
            case Label.name:
                newEnums.push(...[
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                ]);
                break;
            case Button.name:
                newEnums.push(...[
                    { name: 'OneWayToSource', value: count++, mode: BindingMode.OneWayToSource },
                ]);
                break;
            case ProgressBar.name:
                newEnums.push(...[
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                ]);
                break;
            case Sprite.name:
                newEnums.push(...[
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                ]);
                break;
            default:
                newEnums.push(...[
                    { name: 'TwoWay', value: count++, mode: BindingMode.TwoWay },
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                    { name: 'OneWayToSource', value: count++, mode: BindingMode.OneWayToSource },
                ]);
                break;
        }

        this._modeEnums = newEnums;
        // 更新绑定模式枚举
        CCClass.Attr.setClassAttr(this, 'mode', 'enumList', newEnums);

        // 设置绑定模式枚举默认值
        if (this._bindingMode != -1) {
            let findIndex = this._modeEnums.findIndex((item) => {
                return item.mode == this._bindingMode;
            });
            if (findIndex === -1) {
                this.mode = 0;
            }
            else {
                this.mode = findIndex;
            }
        }
        else {
            this.mode = 0;
        }
    }

    /** 更新绑定数据枚举 */
    private updateEditorBindingEnums() {
        // 获取绑定属性
        const newEnums = [];
        let isFunc = this.componentName === Button.name;
        let dataList = isFunc ? decoratorData.getFunctionList(this._parent.bindingType) : decoratorData.getPropertyList(this._parent.bindingType);
        if (dataList) {
            let count = 0;
            dataList.forEach((item) => {
                if (isFunc) {
                    if (item.kind === DataKind.Function) {
                        newEnums.push({ name: item.name, value: count++, type: item.type });
                    }
                } else {
                    if (this.componentCheckTypes.indexOf(item.kind) != -1) {
                        newEnums.push({ name: item.name, value: count++, type: item.type });
                    }
                }
            });
        }
        // 更新绑定数据枚举
        this._bindingEnums = newEnums;
        CCClass.Attr.setClassAttr(this, 'binding', 'enumList', newEnums);

        // 如果绑定数据枚举为空，则警告
        if (this._bindingEnums.length === 0) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 Binding 绑定未找到合适的数据（String,Number,Boolean）`);
        }

        // 设置绑定数据枚举默认值
        if (this._bindingName !== '') {
            let findIndex = this._bindingEnums.findIndex((item) => {
                return item.name === this._bindingName;
            });
            if (findIndex === -1) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件Binding绑定 ${this._bindingName} 已经不存在`);
                // 如果只有一个枚举，就设置为默认值
                if (this._bindingEnums.length == 1) {
                    this.binding = 0;
                }
            }
            else {
                this.binding = findIndex;
            }
        }
        else {
            this.binding = 0;
        }
    }

    protected selectedBinding() {
        if (this._parent) {
            if (this.componentName === Button.name) return;

            let path = this._parent.path;
            path = this._bindingName === this._bindingType ? path : `${path}.${this._bindingName}`;
            // 通过地址获取默认值
            let data = decoratorData.getDefaultInEditor(path);
            if (data != null) {
                this.setComponentValue(data);
            }
        }
    }
    //#endregion

    protected onLoad() {
        if (EDITOR) {
            this.checkEditorComponent();
            return;
        }

        this.initParentDataContext();

        // 设置绑定模式
        switch (this._bindingMode) {
            case BindingMode.TwoWay:
                //this._parent?.bind(this._path, this.onDataChange, this);
                this._isObservable = true;
                this.onComponentCallback();
                break;
            case BindingMode.OneWay:
                this._isObservable = true;
                break;
            case BindingMode.OneTime:
                this._isObservable = true; // 在数据回调通知的时候判断接触绑定
                break;
            case BindingMode.OneWayToSource:
                this.onComponentCallback();
                break;
        }

    }

    protected onDestroy(){
        if (EDITOR) return;

        this._parent?.unregister(this);
    }

    protected onEnable() {
        if (EDITOR) return;

        this.onUpdateData();
    }

    protected onDisable() {
        if (EDITOR) return;

        if (this._isObservable && this._reaction) {
            unobserve(this._reaction);
        }
    }

    private initParentDataContext() {
        if (!this._parent) {
            this._parent = DataContext.lookUp(this.node, true);
            if (!this._parent) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 Binding 找不到上级 DataContext`);
                return;
            }
        }

        this._parent.register(this, this.onUpdateData);
    }

    private _isObservable = false;
    /** 观察函数 */
    private _reaction = null;
    private onUpdateData() {
        // 上下文数据异常，则不继续执行
        if (!this._parent) return;

        this._upperData = this._parent.getDataContextInRegister(this);
        if (!this._upperData) return;

        this._data = this._upperData[this._bindingName];
        if (this._isObservable) {
            // 设置观察函数
            this._reaction = observe((operation) => {
                let data = this._upperData[this._bindingName];
                if (!operation) return;

                this.setComponentValue(data);
            }, this);
        }

        this.setComponentValue(this._data);
    }

    private setComponentValue(value: any) {
        if (value === undefined || value === null) return;

        switch (this.componentName) {
            case Label.name:
                this.node.getComponent(Label).string = `${value}`;
                break;
            case RichText.name:
                this.node.getComponent(RichText).string = `${value}`;
                break;
            case EditBox.name:
                this.node.getComponent(EditBox).string = `${value}`;
                break;
            case Toggle.name:
                this.node.getComponent(Toggle).isChecked = Boolean(value);
                break;
            case Button.name:
                // 按钮的点击事件不做处理，Button绑定模式为BindingMode.OneWayToSource。
                break;
            case Slider.name:
                this.node.getComponent(Slider).progress = Number(value);
                break;
            case ProgressBar.name:
                this.node.getComponent(ProgressBar).progress = Number(value);
                break;
            case PageView.name:
                // PageView 组件在初始化时候，设置当前页会无效，所以延迟设置
                this.scheduleOnce(() => {
                    this.node.getComponent(PageView).setCurrentPageIndex(Number(value));
                }, 0);
                break;
            case Sprite.name:
                ResourcesUtil.setSprite(this.node.getComponent(Sprite), `${value}`);
                break;
            case ToggleContainer.name:
                let toggles = this.node.getComponent(ToggleContainer).getComponentsInChildren(Toggle);
                let index = Number(value);
                for (let i = 0; i < toggles.length; i++) {
                    toggles[i].isChecked = i === index;
                }
                break;
        }

        // 如果是一次绑定，则解绑
        if (this._bindingMode === BindingMode.OneTime) {
            if (this._reaction) {
                unobserve(this._reaction);
            }
        }
    }

    private onComponentCallback() {
        switch (this.componentName) {
            case EditBox.name:
                let editBox = this.node.getComponent(EditBox);
                editBox.node.on(EditBox.EventType.TEXT_CHANGED, (editBox: EditBox) => {
                    // this._upperData[this._bindingName] = editBox.string;
                    if(this._upperData && this._upperData.hasOwnProperty(this._bindingName)){
                        this._upperData[this._bindingName] = editBox.string;
                    }
                }, this);
                break;
            case Toggle.name:
                let toggle = this.node.getComponent(Toggle);
                toggle.node.on(Toggle.EventType.TOGGLE, (toggle: Toggle) => {
                    //this._upperData[this._bindingName] = toggle.isChecked;
                    if(this._upperData && this._upperData.hasOwnProperty(this._bindingName)){
                        this._upperData[this._bindingName] = toggle.isChecked;
                    }
                }, this);
                break;
            case Button.name:
                let button = this.node.getComponent(Button);
                button.node.on(Button.EventType.CLICK, (button: Button) => {
                    //this._upperData[this._bindingName](this.customEventData);
                    if(this._upperData && this._upperData[this._bindingName] != undefined){
                        this._upperData[this._bindingName](this.customEventData);
                    }
                });
                break;
            case Slider.name:
                let slider = this.node.getComponent(Slider);
                slider.node.on('slide', (slider: Slider) => {
                    //this._upperData[this._bindingName] = slider.progress;
                    if(this._upperData && this._upperData.hasOwnProperty(this._bindingName)){
                        this._upperData[this._bindingName] = slider.progress;
                    }
                }, this);
                break;
            case PageView.name:
                let pageView = this.node.getComponent(PageView);
                pageView.node.on(PageView.EventType.PAGE_TURNING, (pageView: PageView) => {
                    //this._upperData[this._bindingName] = pageView.getCurrentPageIndex();
                    if(this._upperData && this._upperData.hasOwnProperty(this._bindingName)){
                        this._upperData[this._bindingName] = pageView.getCurrentPageIndex();
                    }
                }, this);
                break;
            case ToggleContainer.name:
                const containerEventHandler = new EventHandler();
                containerEventHandler.target = this.node; // 这个 node 节点是你的事件处理代码组件所属的节点
                containerEventHandler.component = 'brief.Binding';// 这个是脚本类名
                containerEventHandler.handler = 'onToggleGroup';
                containerEventHandler.customEventData = '0';

                const container = this.node.getComponent(ToggleContainer);
                container.checkEvents.push(containerEventHandler);
                break;
        }
    }

    private onToggleGroup(event: any, customEventData: string) {
        let parent: Node = event.node.parent;
        if (!parent || EDITOR) return;

        // 获取位置索引
        let index = parent.children.indexOf(event.node);
        //this._upperData[this._bindingName] = index;
        if(this._upperData && this._upperData.hasOwnProperty(this._bindingName)){
            this._upperData[this._bindingName] = index;
        }
    }
}