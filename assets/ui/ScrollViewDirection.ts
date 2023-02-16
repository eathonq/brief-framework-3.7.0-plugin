/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 09:04
 */

/** ScrollView方向类型 */
export enum ScrollViewDirectionType {
    /** 水平方向 */
    HORIZONTAL = 0,
    /** 垂直方向 */
    VERTICAL = 1,
}

import { _decorator, Component, Node, Enum, ScrollView, UITransform, Widget, ScrollBar } from 'cc';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

@ccclass('brief.ScrollViewDirection')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/ui-zu-jian-yu-kuo-zhan/scrollviewdirection')
@executeInEditMode
@menu('Brief/UI/ScrollViewDirection')
export class ScrollViewDirection extends Component {

    @property({
        type: Enum(ScrollViewDirectionType),
    })
    private _type: ScrollViewDirectionType = ScrollViewDirectionType.VERTICAL;
    @property({
        type: Enum(ScrollViewDirectionType),
        tooltip: '滚动视图方向',
    })
    get type(): ScrollViewDirectionType {
        return this._type;
    }
    set type(value: ScrollViewDirectionType) {
        this._type = value;
        this.autoAdjustDirection();
    }

    @property({
        type: ScrollView,
        readonly: true,
        tooltip: '滚动视图',
    })
    private scrollView: ScrollView = null;

    @property({
        type: ScrollBar,
        readonly: true,
        tooltip: '滚动视图滚动条',
    })
    private scrollBar: ScrollBar = null;

    @property({
        type: Node,
        readonly: true,
        tooltip: '滚动视图滚动节点',
    })
    private bar: Node = null;

    @property({
        type: Node,
        readonly: true,
        tooltip: '滚动视图可视区域',
    })
    private view: Node = null;

    @property({
        type: Node,
        readonly: true,
        tooltip: '滚动视图内容',
    })
    private content: Node = null;

    private _scrollbarActive = true;
    @property({
        tooltip: '滚动视图滚动节点是否启用',
    })
    get scrollbarActive(): boolean {
        return this._scrollbarActive;
    }
    set scrollbarActive(value: boolean) {
        this._scrollbarActive = value;
        this.scrollBar.node.active = value;
    }

    //#region EDITOR
    onRestore(): void {
        this.checkEditorComponents();
    }

    private checkEditorComponents(): void {
        if (!this.scrollView) {
            this.scrollView = this.node.getComponent(ScrollView);
            if (!this.scrollView) {
                console.error('ScrollViewContent: scrollView is null');
            }
        }

        if (!this.scrollBar) {
            this.scrollBar = this.scrollView.getComponentInChildren(ScrollBar);
            if (!this.scrollBar) {
                console.error('ScrollViewContent: scrollBar is null');
            }
        }

        if (!this.bar) {
            this.bar = this.scrollBar.node.getChildByName('bar');
            if (!this.bar) {
                console.error('ScrollViewContent: bar is null');
            }
        }

        if (!this.view) {
            this.view = this.scrollView.node.getChildByName('view');
            if (!this.view) {
                console.error('ScrollViewContent: view is null');
            }
        }

        if (!this.content) {
            this.content = this.view.getChildByName('content');
            if (!this.content) {
                console.error('ScrollViewContent: content is null');
            }
        }
    }

    //#endregion

    protected onLoad(): void {
        this.checkEditorComponents();
    }

    private autoAdjustDirection() {
        this.view.getComponent(UITransform).setContentSize(this.scrollView.getComponent(UITransform).contentSize);
        this.content.getComponent(UITransform).setContentSize(this.view.getComponent(UITransform).contentSize);

        let scrollViewTransform = this.scrollView.getComponent(UITransform);
        let scrollBarTransform = this.scrollBar.node.getComponent(UITransform);
        let barTransform = this.bar.getComponent(UITransform);
        let contentTransform = this.content.getComponent(UITransform);
        let viewTransform = this.view.getComponent(UITransform);
        if (this.type == ScrollViewDirectionType.VERTICAL) {
            this.scrollView.horizontal = false;
            this.scrollView.horizontalScrollBar = null;
            this.scrollView.vertical = true;
            this.scrollView.verticalScrollBar = this.scrollBar;

            this.scrollBar.direction = ScrollBar.Direction.VERTICAL;
            if (scrollBarTransform.height < scrollBarTransform.width) {
                let scrollbarWidth = scrollBarTransform.height;
                scrollBarTransform.setContentSize(scrollbarWidth, scrollViewTransform.height);
            }

            let widget = this.scrollBar.getComponent(Widget);
            widget.enabled = false;

            scrollBarTransform.setAnchorPoint(1, 0.5);
            this.scrollBar.node.setPosition(
                scrollViewTransform.width * scrollViewTransform.anchorX,
                0);

            if (barTransform.height < barTransform.width)
                barTransform.setContentSize(barTransform.height, barTransform.width);
            barTransform.setAnchorPoint(1, 0);
            this.bar.setPosition(-(scrollBarTransform.width - barTransform.width) / 2, 0);

            contentTransform.setAnchorPoint(0.5, 1);
            this.content.setPosition(0, contentTransform.height * viewTransform.anchorY);
        }
        else {
            this.scrollView.vertical = false;
            this.scrollView.verticalScrollBar = null;
            this.scrollView.horizontal = true;
            this.scrollView.horizontalScrollBar = this.scrollBar;

            this.scrollBar.direction = ScrollBar.Direction.HORIZONTAL;
            if (scrollBarTransform.height > scrollBarTransform.width) {
                let scrollbarHeight = scrollBarTransform.width;
                scrollBarTransform.setContentSize(scrollViewTransform.width, scrollbarHeight);
            }

            let widget = this.scrollBar.getComponent(Widget);
            widget.enabled = false;

            scrollBarTransform.setAnchorPoint(0.5, 1);
            this.scrollBar.node.setPosition(
                0,
                -scrollViewTransform.height * scrollViewTransform.anchorY + scrollBarTransform.height * scrollBarTransform.anchorY);

            if (barTransform.width < barTransform.height)
                barTransform.setContentSize(barTransform.height, barTransform.width);
            barTransform.setAnchorPoint(0, 1);
            this.bar.setPosition(0, -(scrollBarTransform.height - barTransform.height) / 2);

            contentTransform.setAnchorPoint(0, 0.5);
            this.content.setPosition(-contentTransform.width * viewTransform.anchorX, 0);
        }

        if (this.content.children.length > 0) {
            this.autoAdjustItemPosition(this.content, this.content.children);
        }
    }

    private autoAdjustItemPosition(content: Node, items: readonly Node[]) {
        if (this.type == ScrollViewDirectionType.VERTICAL) {
            let topY = 0;
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let itemTransform = item.getComponent(UITransform);
                let itemY = topY + itemTransform.height * (itemTransform.anchorY - 1);
                topY = - itemTransform.height;
                item.setPosition(0 + (itemTransform.anchorX - 0.5) * itemTransform.width, itemY);
            }
        }
        else {
            let leftX = 0;
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let itemTransform = item.getComponent(UITransform);
                let itemX = leftX + itemTransform.width * itemTransform.anchorX;
                leftX = itemTransform.width;
                item.setPosition(itemX, 0 + (itemTransform.anchorY - 0.5) * itemTransform.height);
            }
        }
    }
}