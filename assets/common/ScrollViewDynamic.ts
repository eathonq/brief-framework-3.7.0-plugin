/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-12 09:04
 */

import { CCInteger, Component, Enum, error, Layout, math, Node, ScrollView, tween, UITransform, v2, _decorator } from 'cc';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** ScrollView方向类型 */
export enum Direction {
    /** 水平方向 */
    HORIZONTAL = 0,
    /** 垂直方向 */
    VERTICAL = 1,
}

/**
 * 滚动视图，可以动态设置子节点opacity
 */
@ccclass('brief.ScrollViewDynamic')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/common/scrollviewdynamic')
@executeInEditMode
@menu('Brief/Common/ScrollViewDynamic')
export class ScrollViewDynamic extends Component {

    //#region  组件属性
    @property({
        type: ScrollView,
        readonly: true,
        tooltip: '滚动视图',
    })
    private scrollView: ScrollView = null;

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

    @property({
        type: Enum(Direction),
        readonly: true,
        tooltip: '滚动视图方向',
    })
    public direction: Direction = Direction.VERTICAL;

    @property({
        type: CCInteger, min: 1, step: 1,
        tooltip: '滚动检测单元(值越小检测频率越高)，一般设置为item的高度或宽度的一半',
    })
    scrollUnit = 50;

    @property({
        type: CCInteger, min: 0, step: 1,
        tooltip: '延伸可视区域范围(提前刷新)',
    })
    previewUnit = 0;
    //#endregion

    //#region EDITOR
    onRestore() {
        this.checkEditorComponents();
    }

    private checkEditorComponents() {
        if (!this.scrollView) {
            this.scrollView = this.node.getComponent(ScrollView);
            if (!this.scrollView) {
                error('ScrollViewDynamic: scrollView is null');
                return false;
            }
        }

        if (!this.view) {
            this.view = this.scrollView.node.getChildByName('view');
            if (!this.view) {
                error('ScrollViewContent: view is null');
                return false;
            }
        }

        if (!this.content) {
            this.content = this.scrollView.content;
            if (!this.content) {
                error('ScrollViewContent: content is null');
                return false;
            }
        }

        this.direction = this.scrollView.vertical ? Direction.VERTICAL : Direction.HORIZONTAL;

        return true;
    }
    //#endregion

    protected onLoad() {
        this.checkEditorComponents();

        this.initScrollView();
    }

    private initScrollView() {
        if (this.direction == Direction.VERTICAL) {
            this.scrollView.node.on(ScrollView.EventType.SCROLLING, this.onScrollingWithVertical, this);
        }
        else {
            this.scrollView.node.on(ScrollView.EventType.SCROLLING, this.onScrollingWithHorizontal, this);
        }

        // 监听子节点变化
        this.content.on(Node.EventType.CHILD_REMOVED, () => {
            // 延迟刷新
            this.scheduleOnce(() => {
                this.refresh();
            }, 0);
        }, this);
    }

    private _offsetYUnit = 0;
    private onScrollingWithVertical(scrollView: ScrollView) {
        let offsetYUnit = Math.floor(scrollView.getScrollOffset().y / this.scrollUnit);

        // 单元滚动通知
        if (offsetYUnit != this._offsetYUnit) {
            if (offsetYUnit < 0) return;
            let contentHeight = scrollView.content.getComponent(UITransform).height;
            if (offsetYUnit > contentHeight / this.scrollUnit) return;
            this._offsetYUnit = offsetYUnit;

            let nodeHeight = scrollView.node.getComponent(UITransform).height;
            let viewTop = scrollView.getScrollOffset().y - this.previewUnit;
            let viewBottom = viewTop + nodeHeight + this.previewUnit * 2;
            // 设置不在可视区域opacity为0
            this.updateVerticalContentView(viewTop, viewBottom);

            // 判断是否加载更多
            if (scrollView.getScrollOffset().y >= (contentHeight - nodeHeight - this._preloadUnit)) {
                // 加载更多
                this.onPreloadMore();
            }
        }
    }

    private updateVerticalContentView(viewTop: number, viewBottom: number) {
        let child: Node = null;
        let childTop = 0;
        let childBottom = 0;
        let childTransform: UITransform = null;
        //let childOpacity: UIOpacity = null;
        for (let i = 0; i < this.content.children.length; i++) {
            child = this.content.children[i];
            childTransform = child.getComponent(UITransform);
            // childOpacity = child.getComponent(UIOpacity);
            // if (!childOpacity) childOpacity = child.addComponent(UIOpacity);
            childTop = -child.position.y - childTransform.height * childTransform.anchorY;
            childBottom = childTop + childTransform.height;
            if (childTop < viewBottom && childBottom > viewTop) {
                //childOpacity.opacity = 255;
                for (let j = 0; j < child.children.length; j++) {
                    child.children[j].active = true;
                }
            }
            else {
                //childOpacity.opacity = 0;
                for (let j = 0; j < child.children.length; j++) {
                    child.children[j].active = false;
                }
            }
        }
    }

    private _offsetXUnit = 0;
    private onScrollingWithHorizontal(scrollView: ScrollView) {
        let offsetXUnit = Math.floor(-scrollView.getScrollOffset().x / this.scrollUnit);

        // 单元滚动通知
        if (offsetXUnit != this._offsetXUnit) {
            if (offsetXUnit < 0) return;
            let contentWidth = scrollView.content.getComponent(UITransform).width;
            if (offsetXUnit > contentWidth / this.scrollUnit) return;
            this._offsetXUnit = offsetXUnit;

            let nodeWidth = scrollView.node.getComponent(UITransform).width;
            let viewLeft = -scrollView.getScrollOffset().x - this.previewUnit;
            let viewRight = viewLeft + nodeWidth + this.previewUnit * 2;
            // 设置不在可视区域opacity为0
            this.updateHorizontalContentView(viewLeft, viewRight);

            // 判断是否加载更多
            if (-scrollView.getScrollOffset().x >= (contentWidth - nodeWidth - this._preloadUnit)) {
                // 加载更多
                this.onPreloadMore();
            }
        }
    }

    private updateHorizontalContentView(viewLeft: number, viewRight: number) {
        let child: Node = null;
        let childLeft = 0;
        let childRight = 0;
        let childTransform: UITransform = null;
        // let childOpacity: UIOpacity = null;
        for (let i = 0; i < this.content.children.length; i++) {
            child = this.content.children[i];
            childTransform = child.getComponent(UITransform);
            // childOpacity = child.getComponent(UIOpacity);
            // if (!childOpacity) childOpacity = child.addComponent(UIOpacity);
            childLeft = child.position.x - childTransform.width * childTransform.anchorX;
            childRight = childLeft + childTransform.width;
            if (childLeft < viewRight && childRight > viewLeft) {
                //childOpacity.opacity = 255;
                for (let j = 0; j < child.children.length; j++) {
                    child.children[j].active = true;
                }
            }
            else {
                //childOpacity.opacity = 0;
                for (let j = 0; j < child.children.length; j++) {
                    child.children[j].active = false;
                }
            }
        }
    }

    private _firstRefresh = false;
    private refresh() {
        if (this.direction == Direction.VERTICAL) {
            if (!this._firstRefresh) {
                this._firstRefresh = true;
                // 第一次初始化时，通过滚动到顶部位置初始化内容项目位置参数
                this.scrollView.scrollTo(v2(0, 1));
            }
            //this.updateVerticalContentView(0, this.scrollView.node.getComponent(UITransform).height);

            // 刷新当前可视区域
            let nodeHeight = this.scrollView.node.getComponent(UITransform).height;
            let viewTop = this.scrollView.getScrollOffset().y - this.previewUnit;
            let viewBottom = viewTop + nodeHeight + this.previewUnit * 2;
            // 设置不在可视区域opacity为0
            this.updateVerticalContentView(viewTop, viewBottom);
        }
        else {
            if (!this._firstRefresh) {
                this._firstRefresh = true;
                // 第一次初始化时，通过滚动到左边位置初始化内容项目位置参数
                this.scrollView.scrollTo(v2(0, 0));
            }
            //this.updateHorizontalContentView(0, this.scrollView.node.getComponent(UITransform).width);

            // 刷新当前可视区域
            let nodeWidth = this.scrollView.node.getComponent(UITransform).width;
            let viewLeft = -this.scrollView.getScrollOffset().x - this.previewUnit;
            let viewRight = viewLeft + nodeWidth + this.previewUnit * 2;
            // 设置不在可视区域opacity为0
            this.updateHorizontalContentView(viewLeft, viewRight);
        }
    }

    private _scrollToCheckLoadMore = false;
    private _preloadUnit = 0;
    private _onPreloadMore = null;
    private _target = null;
    private onPreloadMore() {
        if (this._onPreloadMore) {
            if (this._target)
                this._onPreloadMore.call(this._target);
            else
                this._onPreloadMore();
        }

        this._scrollToCheckLoadMore = true;
    }

    /**
     * 设置预加载处理
     * @param preloadUnit 预加载单元范围
     * @param onPreloadMore 预加载回调
     * @param target 预加载回调对象
     */
    setPreloadMore(preloadUnit: number, onPreloadMore: Function, target?: any) {
        this._preloadUnit = preloadUnit;
        this._onPreloadMore = onPreloadMore;
        this._target = target;
    }

    /**
     * 滚动到指定索引的内容项位置
     * @param index 索引
     * @note 0开始，滚动索引超过当前最大索引，将触发多次滚动
     */
    scrollTo(index: number, timeInSecond = .5) {
        let preIndex = index;

        // 索引安全范围检查
        if (index < 0) index = 0;
        if (index >= this.content.children.length) index = this.content.children.length - 1;

        // 计算滚动位置
        let pos: math.Vec2;
        if (this.direction == Direction.VERTICAL) {
            let child = this.content.children[index];
            let childTransform = child.getComponent(UITransform);
            let childTop = -child.position.y - childTransform.height * childTransform.anchorY;
            let layout = this.content.getComponent(Layout);
            if (layout) {
                childTop -= layout.spacingY;
            }
            pos = v2(child.position.x, childTop);
        }
        else {
            let child = this.content.children[index];
            let childTransform = child.getComponent(UITransform);
            let childLeft = child.position.x - childTransform.width * childTransform.anchorX;
            let layout = this.content.getComponent(Layout);
            if (layout) {
                childLeft -= layout.spacingX;
            }
            pos = v2(childLeft, child.position.y);
        }

        this.scrollView.scrollToOffset(pos, .5);

        this._scrollToCheckLoadMore = false;
        let self = this;
        tween(this.scrollView.node).delay(timeInSecond + .1).call(() => {
            if (self._scrollToCheckLoadMore) {
                self.scrollTo(preIndex, .2);
            }
        }).start();
    }
}
