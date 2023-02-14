/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 13:06
 */

import { _decorator, Node, EditBox, Component, Enum, Toggle, Slider, PageView, Sprite, ToggleContainer, EventHandler, Button, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
import { observe, Operation, unobserve } from '../common/ReactiveObserve';
import { ResourcesUtil } from '../common/ResourcesUtil';
import { DataContext } from "./DataContext";
import { ItemsSource } from './ItemsSource';
import { decoratorData, DecoratorDataKind } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** 组件检测数组 */
const COMP_ARRAY_CHECK = [
    //['绑定组件名','绑定属性名']
    ['cc.Label', 'string'],
    ['cc.RichText', 'string'],
    ['cc.EditBox', 'string'],
    ['cc.Toggle', 'isChecked'], // Toggle继承于Button，所以必须放在Button前面
    ['cc.Button', 'click'],
    ['cc.Slider', 'progress'],
    ['cc.ProgressBar', 'progress'],
    ['cc.PageView', 'CurrentPageIndex'],
    ['cc.Sprite', 'SpriteFrame'],
    ['cc.ToggleContainer', 'CheckedIndex'], // 仅支持 allowSwitchOff = false
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

/** 数据绑定组件 */
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

    /** 数据上下文路径 */
    @property({ visible: false })
    private parent: DataContext = null;
    @property({
        tooltip: '数据上下文',
        displayName: 'DataContext',
        visible: true,
    })
    private get _parent() {
        return this.parent;
    }
    private set _parent(value) {
        this.parent = value;
        this.updateEditorBindingEnums();
    }

    @property
    private _bindingMode = -1;
    private _modeEnums: { name: string, value: number, mode: BindingMode }[] = [];
    private _mode = 0;
    /** 绑定模式 */
    @property({
        tooltip: '绑定模式:\n TwoWay: 双向绑定(Model<->View);\n OneWay: 单向绑定(Model->View);\n OneTime: 一次单向绑定(Model->View);\n OneWayToSource: 单向绑定(Model<-View)。',
        type: Enum({}),
        serializable: true,
    })
    private get mode() {
        return this._mode;
    }
    private set mode(value) {
        this._mode = value;
        if (this._modeEnums[value]) {
            this._bindingMode = this._modeEnums[value].mode;
        }
    }

    @property
    private _bindingName = "";
    private _bindingEnums: { name: string, value: number }[] = [];
    private _binding = 0;
    /** 绑定属性 */
    @property({
        tooltip: '绑定属性',
        type: Enum({}),
        serializable: true,
    })
    private get binding() {
        return this._binding;
    }
    private set binding(value) {
        this._binding = value;
        if (this._bindingEnums[value]) {
            this._bindingName = this._bindingEnums[value].name;
        }
    }

    private _customEventData_visible = false;
    /** 绑定方法自定义参数 */
    @property({
        tooltip: '绑定方法自定义参数',
        visible() {
            return this._customEventData_visible;
        }
    })
    private customEventData: string = "";

    /** 当前绑定数据 */
    protected _data: any = null;
    /** 当前绑定数据 */
    get dataContext() {
        return this._data;
    }

    /** 上一级绑定数据 */
    private upperDataContext: any = null;

    //#region EDITOR
    onRestore() {
        this.parent = null;
        this.checkEditorComponent();
    }

    private checkEditorComponent() {
        this.initParentDataContext();

        // 组件查找
        let checkArray = COMP_ARRAY_CHECK;
        this.componentName = "";
        this.componentProperty = "";
        for (const item of checkArray) {
            if (this.node.getComponent(item[0])) {
                this.componentName = item[0];
                this.componentProperty = item[1];
                break;
            }
        }
        if (this.componentName == "") {
            console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 Binding `, '找不到组件');
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
            case 'cc.Button':
                this._customEventData_visible = true;
                break;
            case 'cc.ToggleContainer':
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
            case 'cc.Label':
                newEnums.push(...[
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                ]);
                break;
            case 'cc.Button':
                newEnums.push(...[
                    { name: 'OneWayToSource', value: count++, mode: BindingMode.OneWayToSource },
                ]);
                break;
            case 'cc.ProgressBar':
                newEnums.push(...[
                    { name: 'OneWay', value: count++, mode: BindingMode.OneWay },
                    { name: 'OneTime', value: count++, mode: BindingMode.OneTime },
                ]);
                break;
            case 'cc.Sprite':
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
            let findIndex = newEnums.findIndex((item) => {
                return item.mode == this._bindingMode;
            });
            if (findIndex === -1) {
                console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 Binding `, '绑定模式枚举默认值设置失败');
                // 如果只有一个枚举，就设置为默认值
                if (this._bindingEnums.length == 1) {
                    this.binding = 0;
                }
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
        let isFunc = this.componentName === 'cc.Button';
        let dataList = isFunc ? decoratorData.getFunctionList(this.parent.path) : decoratorData.getPropertyList(this.parent.path);
        // 更新绑定数据枚举
        if (dataList) {
            const newEnums = [];
            let count = 0;
            dataList.forEach((item) => {
                if (isFunc) {
                    if (item.kind === DecoratorDataKind.Function) {
                        newEnums.push({ name: item.name, value: count++ });
                    }
                } else {
                    if (item.kind === DecoratorDataKind.Simple) {
                        newEnums.push({ name: item.name, value: count++ });
                    }
                }
            });
            this._bindingEnums = newEnums;
            CCClass.Attr.setClassAttr(this, 'binding', 'enumList', newEnums);
        }
        else {
            this._bindingEnums = [];
            CCClass.Attr.setClassAttr(this, 'binding', 'enumList', []);
        }

        // 设置绑定数据枚举默认值
        if (this._bindingName !== '') {
            let findIndex = this._bindingEnums.findIndex((item) => { return item.name === this._bindingName; });
            if (findIndex === -1) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} `, `组件Binding绑定 ${this._bindingName} 已经不存在`);
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
        if (this.parent) return;

        this.parent = DataContext.lookUp(this.node, true);
        if (!this.parent) {
            console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 ItemsSource `, '找不到 DataContext');
        }

        this.parent.addUpdateCallback(this.onUpdateData.bind(this));
    }

    private _isObservable = false;
    /** 观察函数 */
    private _reaction = null;
    private onUpdateData() {
        if (!this.parent.dataContext) return;

        // 数组类型数据，重新设置绑定属性（重新定位数组元素）
        if (this.parent instanceof ItemsSource) {
            let index = this.parent.getItemIndex(this.node);
            this.upperDataContext = this.parent.dataContext[index];
        }
        else {
            this.upperDataContext = this.parent.dataContext;
        }

        this._data = this.upperDataContext[this._bindingName];
        if (this._isObservable) {
            // 设置观察函数
            this._reaction = observe(((operation: Operation) => {
                let data = this.upperDataContext[this._bindingName];
                if (!operation) return;

                this.setComponentValue(data);
            }).bind(this));
        }

        this.setComponentValue(this._data);
    }

    private setComponentValue(value: any) {
        if (value === undefined || value === null) return;

        switch (this.componentName) {
            case 'cc.PageView':
                // PageView 组件在初始化时候，设置当前页会无效，所以延迟设置
                this.scheduleOnce(() => {
                    this.node.getComponent(PageView).setCurrentPageIndex(value);
                }, 0);
                break;
            case 'cc.Sprite':
                ResourcesUtil.setSprite(this.node.getComponent(Sprite), value);
                break;
            case 'cc.Button':
                // 按钮的点击事件不做处理，Button绑定模式为BindingMode.OneWayToSource。
                break;
            case 'cc.ToggleContainer':
                let toggles = this.node.getComponent(ToggleContainer).getComponentsInChildren(Toggle);
                for (let i = 0; i < toggles.length; i++) {
                    toggles[i].isChecked = i === value;
                }
                break;
            default:
                let component = this.node.getComponent(this.componentName);
                // 用undefined判断，自有属性和继承属性均可判断
                if (component[this.componentProperty] !== undefined) {
                    component[this.componentProperty] = value;
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
            case 'cc.EditBox':
                let editBox = this.node.getComponent(EditBox);
                editBox.node.on(EditBox.EventType.TEXT_CHANGED, (editBox: EditBox) => {
                    this.upperDataContext[this._bindingName] = editBox.string;
                }, this);
                break;
            case 'cc.Toggle':
                let toggle = this.node.getComponent(Toggle);
                toggle.node.on(Toggle.EventType.TOGGLE, (toggle: Toggle) => {
                    this.upperDataContext[this._bindingName] = toggle.isChecked;
                }, this);
                break;
            case 'cc.Button':
                let button = this.node.getComponent(Button);
                button.node.on(Button.EventType.CLICK, (button: Button) => {
                    this.upperDataContext[this._bindingName](this.customEventData);
                });
                break;
            case 'cc.Slider':
                let slider = this.node.getComponent(Slider);
                slider.node.on('slide', (slider: Slider) => {
                    this.upperDataContext[this._bindingName] = slider.progress;
                }, this);
                break;
            case 'cc.PageView':
                let pageView = this.node.getComponent(PageView);
                pageView.node.on(PageView.EventType.PAGE_TURNING, (pageView: PageView) => {
                    this.upperDataContext[this._bindingName] = pageView.getCurrentPageIndex();
                }, this);
                break;
            case 'cc.ToggleContainer':
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
        let parent = event.node.parent;
        if (!parent) return;

        // 获取位置索引
        let index = parent.children.indexOf(event.node);
        this.upperDataContext[this._bindingName] = index;
    }
}