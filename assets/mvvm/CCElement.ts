/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-19 18:59
 */

import { _decorator, Component, Node, Label, RichText, EditBox, Toggle, Button, Slider, ProgressBar, PageView, Sprite, ToggleContainer, Enum, CCClass, EventHandler } from 'cc';
import { EDITOR } from 'cc/env';
import { ResourcesUtil } from '../cocos/ResourcesUtil';
import { DataKind } from './MVVM';
const { ccclass, property, executeInEditMode } = _decorator;

type ElementBinding = {
    name: string;
    kind: DataKind[];
};

type Element = {
    component: any;
    binding: ElementBinding[];
}

const COMP_ELEMENT: Element[] = [
    {
        component: Label,
        binding: [{ name: 'string', kind: [DataKind.String, DataKind.Number, DataKind.Boolean] }]
    },
    {
        component: RichText,
        binding: [{ name: 'string', kind: [DataKind.String, DataKind.Number, DataKind.Boolean] }]
    },
    {
        component: EditBox,
        binding: [{ name: 'string', kind: [DataKind.String, DataKind.Number, DataKind.Boolean] }]
    },
    {
        component: Toggle,
        binding: [{ name: 'isChecked', kind: [DataKind.Boolean] }]
    },
    {
        component: Button,
        binding: [{ name: 'click', kind: [DataKind.Function] }]
    },
    {
        component: Slider,
        binding: [{ name: 'progress', kind: [DataKind.Number] }]
    },
    {
        component: ProgressBar,
        binding: [{ name: 'progress', kind: [DataKind.Number] }]
    },
    {
        component: PageView,
        binding: [{ name: 'currentPageIndex', kind: [DataKind.Number] }]
    },
    {
        component: Sprite,
        binding: [{ name: 'spriteFrame', kind: [DataKind.String] }]
    },
    {
        component: ToggleContainer,
        binding: [{ name: 'checkedIndex', kind: [DataKind.Number] }] // 仅支持 allowSwitchOff = false
    },
];

const NODE_ELEMENT: Element[] = [
    {
        component: Node,
        binding: [{ name: 'active', kind: [DataKind.Boolean] }]
    }
];

/**
 * Cocos Creator 元素
 * 用于识别元素的数据类型
 * 不直接使用，请使用 Binding 组件
 */
@ccclass('brief.CCElement')
@executeInEditMode
export class CCElement extends Component {

    @property
    protected _elementName = "";
    private _elementEnums: { name: string, value: number }[] = [];
    private _bindingElement = 0;
    /** 绑定元素的名字 */
    @property({
        type: Enum({}),
        displayName: 'Element',
        tooltip: '绑定元素（组件或节点）',
    })
    get bindingElement() {
        return this._bindingElement;
    }
    protected set bindingElement(value) {
        this._bindingElement = value;
        if (this._elementEnums[value]) {
            this._elementName = this._elementEnums[value].name;
            this.selectedComponent();
        }
    }

    @property
    private _propertyName = "";
    private _propertyEnums: { name: string, value: number }[] = [];
    private _bindingProperty = 0;
    /** 组件上需要监听的属性 */
    @property({
        type: Enum({}),
        displayName: 'Property',
        tooltip: '绑定元素属性（属性或方法）',
    })
    get bindingProperty() {
        return this._bindingProperty;
    }
    protected set bindingProperty(value) {
        this._bindingProperty = value;
        if (this._propertyEnums[value]) {
            this._propertyName = this._propertyEnums[value].name;
            this.selectedProperty();
        }
    }

    /** 组件上需要监听的属性的数据类型 */
    protected _elementKinds: DataKind[] = [];

    /** 绑定方法自定义参数 */
    @property({
        tooltip: '绑定方法自定义参数',
        displayName: 'CustomEventData',
        visible() {
            return this._elementName == Button.name;
        },
    })
    private customEventData: string = "";

    //#region EDITOR
    onRestore() {
        this._elementName = '';
        this._propertyName = '';
        this.checkEditorComponent();
    }

    protected checkEditorComponent() {
        this.identifyComponent();
        this.updateEditorElementEnums();
    }

    private _identifyList: Element[] = [];
    private identifyComponent() {
        this._identifyList = [];
        for (let i = 0; i < COMP_ELEMENT.length; i++) {
            if (this.node.getComponent(COMP_ELEMENT[i].component)) {
                this._identifyList.push(COMP_ELEMENT[i]);
            }
        }

        this._identifyList = this._identifyList.concat(NODE_ELEMENT);
    }

    private updateEditorElementEnums() {
        const newEnums = [];
        if (this._identifyList.length > 0) {
            let count = 0;
            for (let i = 0; i < this._identifyList.length; i++) {
                const element = this._identifyList[i];
                newEnums.push({ name: element.component.name, value: count });
                count++;
            }
        }

        this._elementEnums = newEnums;
        CCClass.Attr.setClassAttr(this, 'bindingElement', 'enumList', newEnums);

        // 设置绑定数据枚举默认值
        if (this._elementName !== '') {
            let findIndex = this._elementEnums.findIndex((item) => {
                return item.name === this._elementName;
            });
            if (findIndex != -1) {
                this.bindingElement = findIndex;
                return;
            }
        }
        this.bindingElement = 0;
    }

    private updateEditorPropertyTypes() {
        if (this._identifyList.length > 0) {
            const element = this._identifyList[this._bindingElement];
            if (element) {
                const property = element.binding[this._bindingProperty];
                if (property) {
                    this._elementKinds = property.kind;
                }
            }
        }
    }

    private updateEditorPropertyEnums() {
        const newEnums = [];
        if (this._identifyList.length > 0) {
            const element = this._identifyList[this._bindingElement];
            if (element) {
                for (let i = 0; i < element.binding.length; i++) {
                    newEnums.push({ name: element.binding[i].name, value: i });
                }
            }
        }

        this._propertyEnums = newEnums;
        CCClass.Attr.setClassAttr(this, 'bindingProperty', 'enumList', newEnums);

        // 设置绑定数据枚举默认值
        if (this._propertyName !== '') {
            let findIndex = this._propertyEnums.findIndex((item) => {
                return item.name === this._propertyName;
            });
            if (findIndex != -1) {
                this.bindingProperty = findIndex;
                return;
            }
        }
        this.bindingProperty = 0;
    }

    private selectedComponent() {
        this.updateEditorPropertyTypes(); // 需要先执行
        this.updateEditorPropertyEnums();
    }

    protected selectedProperty() {
        // TODO
    }
    //#endregion

    protected onLoad() {
        if (EDITOR) {
            this.checkEditorComponent();
            return;
        }
    }

    protected setElementValue(value: any) {
        if (value === undefined || value === null) return;

        switch (this._elementName) {
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
            case Node.name:
                this.node.active = value !== false;
                break;
        }
    }

    private _elementValueChange: (value: any) => void = null;
    protected onElementCallback(elementValueChange: (value: any) => void) {
        this._elementValueChange = elementValueChange;
        switch (this._elementName) {
            case EditBox.name:
                let editBox = this.node.getComponent(EditBox);
                editBox.node.on(EditBox.EventType.TEXT_CHANGED, (editBox: EditBox) => {
                    this._elementValueChange?.(editBox.string);
                }, this);
                break;
            case Toggle.name:
                let toggle = this.node.getComponent(Toggle);
                toggle.node.on(Toggle.EventType.TOGGLE, (toggle: Toggle) => {
                    this._elementValueChange?.(toggle.isChecked);
                }, this);
                break;
            case Button.name:
                let button = this.node.getComponent(Button);
                button.node.on(Button.EventType.CLICK, (button: Button) => {
                    this._elementValueChange?.(this.customEventData);
                });
                break;
            case Slider.name:
                let slider = this.node.getComponent(Slider);
                slider.node.on('slide', (slider: Slider) => {
                    this._elementValueChange?.(slider.progress);
                }, this);
                break;
            case PageView.name:
                let pageView = this.node.getComponent(PageView);
                pageView.node.on(PageView.EventType.PAGE_TURNING, (pageView: PageView) => {
                    this._elementValueChange?.(pageView.getCurrentPageIndex());
                }, this);
                break;
            case ToggleContainer.name:
                const containerEventHandler = new EventHandler();
                containerEventHandler.target = this.node; // 这个 node 节点是你的事件处理代码组件所属的节点
                containerEventHandler.component = 'brief.CCElement';// 这个是脚本类名
                containerEventHandler.handler = 'onToggleGroup';
                containerEventHandler.customEventData = '0';

                const container = this.node.getComponent(ToggleContainer);
                container.checkEvents.push(containerEventHandler);
                break;
            case Node.name:
                this.node.on(Node.EventType.ACTIVE_IN_HIERARCHY_CHANGED, () => {
                    this._elementValueChange?.(this.node.active);
                }, this);
                break;
        }
    }

    private onToggleGroup(event: any, customEventData: string) {
        let parent: Node = event.node.parent;
        if (!parent || EDITOR) return;

        // 获取位置索引
        let index = parent.children.indexOf(event.node);
        this._elementValueChange?.(index);
    }
}
