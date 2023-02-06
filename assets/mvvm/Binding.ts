/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Node, EditBox, Component, Enum, Toggle, Slider, PageView, Sprite, ToggleContainer, EventHandler, Button, CCClass } from 'cc';
import { EDITOR } from 'cc/env';
import { Locator } from '../common/Locator';
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
enum BindingMode {
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

    /** 数据上下文 */
    @property({
        tooltip: '数据上下文',
        readonly: true,
        displayName: 'DataContext',
    })
    private get parentPath() {
        return this._context?.path;
    }

    //#region 绑定属性
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
    //#endregion

    private _mode_visible = true;
    /** 绑定模式 */
    @property({
        type: Enum(BindingMode),
        tooltip: '绑定模式:\n TwoWay: 双向绑定(View<=>Model);\n OneWay: 单向绑定(View<-Model);\n OneTime: 一次单向绑定(View<-Model);\n OneWayToSource: 单向绑定(View->Model)。',
        visible() {
            return this._mode_visible;
        }
    })
    private mode: BindingMode = BindingMode.TwoWay;

    /** 数据绑定全路径 */
    private _path = '';
    /** 绑定上下文 */
    private _context: DataContext = null;

    onRestore() {
        this.checkEditorComponent();
    }

    protected onLoad() {
        this.checkEditorComponent();
        if (EDITOR) return;

        if (!this._context) {
            this._context = DataContext.lookUpDataContext(this.node);
            if (!this._context) {
                console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 Binding `, '找不到 DataContext');
                return;
            }
        }

        let path = this._context.path;
        let bindingName = this._bindingName;
        // 数组字段类型转换
        if (this._context instanceof ItemsSource) {
            let index = this._context.getItemsIndex(this.node);
            path = `${path}.${index}`;
            if (this._context.isSimpleType()) {
                bindingName = "";
            }
            this._index = index;
        }
        this._path = bindingName !== "" ? `${path}.${bindingName}` : path;

        // 设置绑定模式
        switch (this.mode) {
            case BindingMode.TwoWay:
                this._context?.bind(this._path, this.onDataChange, this);
                this.onComponentCallback();
                break;
            case BindingMode.OneWay:
                this._context?.bind(this._path, this.onDataChange, this);
                break;
            case BindingMode.OneTime:
                this._context?.bind(this._path, this.onDataChange, this);
                // 在数据回调通知的时候判断接触绑定
                break;
            case BindingMode.OneWayToSource:
                this.onComponentCallback();
                break;
        }

        // 初始化默认值 start 时候会调用
        // this.setComponentValue(this._context?.getValue(this._path));
    }

    /** 数组索引 */
    private _index = -1;
    protected start() {
        if (EDITOR) return;

        // 检测数组索引是否变化
        if (this._context instanceof ItemsSource) {
            let index = this._context.getItemsIndex(this.node);
            if (this._index != index) {
                this._index = index;

                this._context?.unbind(this._path, this.onDataChange, this);
                this.onLoad();
                this.setComponentValue(this._context?.getValue(this._path));
                return;
            }
        }

        // 初始化默认值
        this.setComponentValue(this._context?.getValue(this._path));
    }

    protected onDestroy(): void {
        this._context?.unbind(this._path, this.onDataChange, this);
        this._context = null;
    }

    //#region EDITOR 
    private checkEditorComponent() {
        if (!EDITOR) return;

        // 上下文数据查找
        let context = DataContext.lookUpDataContext(this.node);
        if (!context) {
            console.warn(`path:${Locator.getNodeFullPath(this.node)} `, `组件 Binding `, '找不到 DataContext');
            return;
        }
        this._context = context;

        // 数组字段类型转换
        if (this._context instanceof ItemsSource) {
            if (this._context.isSimpleType()) {
                this._mode_visible = false;
            }
        }

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

        // 组件绑定数据类型更新
        this.updateEditorBindDataEnum(context);
    }

    /** 默认组件设置 */
    private defaultEditorComponent() {
        switch (this.componentName) {
            case 'cc.Button':
                this.mode = BindingMode.OneWayToSource;
                this._mode_visible = false;
                this._customEventData_visible = true;
                break;
            case 'cc.Sprite':
                this.mode = BindingMode.OneWay;
                this._mode_visible = false;
                break;
            case 'cc.ToggleContainer':
                const container = this.node.getComponent(ToggleContainer);
                container.allowSwitchOff = false;
                break;
            default:
                break;
        }
    }

    /** 更新绑定数据枚举 */
    private updateEditorBindDataEnum(context: DataContext) {
        let isFunc = this.componentName === 'cc.Button';
        let dataList = isFunc ? decoratorData.getFunctionList(context.path) : decoratorData.getPropertyList(context.path);
        // 更新绑定枚举
        if (dataList) {
            const arr = [];
            let count = 0;
            dataList.forEach((item) => {
                if (isFunc) {
                    if (item.kind === DecoratorDataKind.Function) {
                        arr.push({ name: item.name, value: count++ });
                    }
                } else {
                    if (item.kind === DecoratorDataKind.Simple) {
                        arr.push({ name: item.name, value: count++ });
                    }
                }
            });
            this._bindingEnums = arr;
            CCClass.Attr.setClassAttr(this, 'binding', 'enumList', arr);
        }
        else {
            this._bindingEnums = [];
            CCClass.Attr.setClassAttr(this, 'binding', 'enumList', []);
        }

        // 设置绑定枚举默认值
        if (this._bindingName !== '') {
            let findIndex = this._bindingEnums.findIndex((item) => { return item.name === this._bindingName; });
            if (findIndex === -1) {
                console.warn(`PATH ${Locator.getNodeFullPath(this.node)} `, `组件Binding绑定 ${this._bindingName} 已经不存在`);
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

    private onComponentCallback() {
        switch (this.componentName) {
            case 'cc.EditBox':
                let editBox = this.node.getComponent(EditBox);
                editBox.node.on(EditBox.EventType.TEXT_CHANGED, (editBox: EditBox) => {
                    this._context?.setValue(this._path, editBox.string);
                }, this);
                break;
            case 'cc.Toggle':
                let toggle = this.node.getComponent(Toggle);
                toggle.node.on(Toggle.EventType.TOGGLE, (toggle: Toggle) => {
                    this._context?.setValue(this._path, toggle.isChecked);
                }, this);
                break;
            case 'cc.Button':
                let button = this.node.getComponent(Button);
                button.node.on(Button.EventType.CLICK, (button: Button) => {
                    this._context?.doCallback(this._path, this.customEventData);
                });
                break;
            case 'cc.Slider':
                let slider = this.node.getComponent(Slider);
                slider.node.on('slide', (slider: Slider) => {
                    this._context?.setValue(this._path, slider.progress);
                }, this);
                break;
            case 'cc.PageView':
                let pageView = this.node.getComponent(PageView);
                pageView.node.on(PageView.EventType.PAGE_TURNING, (pageView: PageView) => {
                    this._context?.setValue(this._path, pageView.getCurrentPageIndex());
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
        // let index = parseInt(customEventData);
        let parent = event.node.parent;
        if (!parent) return;

        // 获取位置索引
        let index = parent.children.indexOf(event.node);
        this._context?.setValue(this._path, index);
    }

    private onDataChange(newVal: any, oldVal: any, path: string) {
        if (path !== this._path) return;

        this.setComponentValue(newVal);
    }

    // get componentValue() {
    //     return this.getComponentValue();
    // }

    /** 获取组件值 */
    // private getComponentValue(): any {
    //     switch (this.componentName) {
    //         case 'cc.PageView':
    //             return this.node.getComponent(PageView).getCurrentPageIndex();
    //         case 'cc.Sprite':
    //             return this.node.getComponent(Sprite).spriteFrame.nativeUrl;
    //         case 'cc.ToggleContainer':
    //             return 0;
    //         default:
    //             return this.node.getComponent(this.componentName)[this.componentProperty];
    //     }
    // }

    /** 解决某些组件不能在组件初始化时候马上进行设置的优化处理 */
    private _delaySetComponentValue = true;
    private _oldValue: any = null;
    /** 设置组件值 */
    private setComponentValue(value: any) {
        if (value === undefined || value === null) return;
        if (this._oldValue === value) return;
        this._oldValue = value;

        switch (this.componentName) {
            case 'cc.PageView':
                if (this._delaySetComponentValue) {
                    this._delaySetComponentValue = false;
                    this.scheduleOnce(() => {
                        this.node.getComponent(PageView).setCurrentPageIndex(value);
                    }, 0.1);
                }
                else {
                    this.node.getComponent(PageView).setCurrentPageIndex(value);
                }
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
        if (this.mode === BindingMode.OneTime) {
            this._context?.unbind(this._path, this.onDataChange, this);
        }
    }
}