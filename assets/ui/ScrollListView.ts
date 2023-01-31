/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { _decorator, Component, Node, Vec3, Size, NodePool, instantiate, ScrollView, Enum, UITransform, Layout, v3, CCInteger, error } from 'cc';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

/** ScrollView方向类型 */
export enum ScrollViewDirectionType {
    /** 水平方向 */
    HORIZONTAL = 0,
    /** 垂直方向 */
    VERTICAL = 1,
}

/** 滚动视图列表加载类型枚举 */
export enum ScrollListViewEvent {
    /** 刷新加载 */
    REFRESH,
    /** 加载更多 */
    MORE,
    // /** 上一个数据 */
    // PREVIOUS,
    // /** 下一个数据 */
    // NEXT,
}

/** 滚动视图列表项信息 */
class ScrollListViewInfo {
    /** 数据位置索引(从0开始) */
    index: number;
    /** 单位位置索引(从0开始) */
    unitIndex: number;

    item: Node;

    position: Vec3;
    size: Size;
    anchorX: number;
    anchorY: number;
}

class ScrollListViewData {
    /** 数据(数据需要包含 type 数据) */
    data: { type: string | number };

    constructor(data: { type: string | number }) {
        this.data = data;
    }
}

@ccclass('brief.ScrollListViewTemplateData')
export class ScrollListViewTemplateData {
    @property({
        tooltip: "模版类型",
    })
    type: string = "";
    @property({
        type: Node,
        tooltip: "模版类型",
    })
    template: Node = null;
}

/** 滚动视图列表项加载管理 */
class ScrollListViewItemManager {
    private initWithTemplate = false;
    private itemPoolMap: Map<string, NodePool>;
    private itemTemplateMap: Map<string, Node>;
    private itemTemplateNameTypeMap: Map<string, string>;
    private itemDataList: any[] = [];

    private _onLoad: (type: ScrollListViewEvent, index: number) => any[];
    private _onLoadItem: (index: number) => Node;
    private _onUnloadItem: (item: Node, index: number) => void = null;
    private _onUpdateItem: (item: Node, data: any, index: number) => void;

    constructor(initWithTemplate: boolean,
        onLoad: (type: ScrollListViewEvent, index: number) => any[],
        onLoadItem: (index: number) => Node,
        onUnloadItem: (item: Node, index: number) => void = null,
        onUpdateItem: (item: Node, data: any, index: number) => void) {

        this.initWithTemplate = initWithTemplate;
        this._onLoad = onLoad;
        this._onLoadItem = onLoadItem;
        this._onUnloadItem = onUnloadItem;
        this._onUpdateItem = onUpdateItem;

        this.itemPoolMap = new Map<string, NodePool>();
        this.itemTemplateMap = new Map<string, Node>();
        this.itemTemplateNameTypeMap = new Map<string, string>();
        this.itemDataList = [];
    }

    dispose() {
        this.itemPoolMap.forEach((pool, type) => {
            pool.clear();
        });
        this.itemPoolMap.clear();
        this.itemTemplateMap.clear();
        this.itemTemplateNameTypeMap.clear();
        this.itemDataList.length = 0;
    }

    getItemType(item: Node): string {
        return this.itemTemplateNameTypeMap.get(item.name);
    }

    resetData() {
        this.itemDataList.length = 0;
    }

    refresh() {
        this._onLoad(ScrollListViewEvent.REFRESH, 0);
    }

    setTemplate(templates: ScrollListViewTemplateData[]): void {
        this.itemTemplateMap = new Map<string, Node>();
        this.itemPoolMap = new Map<string, NodePool>();
        for (let i = 0; i < templates.length; i++) {
            let item = templates[i];

            let type: string = item.type;
            this.itemTemplateMap.set(type, item.template);
            this.itemTemplateNameTypeMap.set(item.template.name, type);

            let pool = new NodePool('myTemplate_' + type);
            this.itemPoolMap.set(type, pool);
        }
    }

    loadMore(lastIndex: number): Node[] {
        let items = this._onLoad(ScrollListViewEvent.MORE, lastIndex);
        // 添加数据
        if (this.initWithTemplate) {
            let index = lastIndex + 1;
            let nodeList: Node[] = [];
            for (let i = 0; i < items.length; i++) {
                let itemData = items[i];
                if (!itemData) continue;
                let type: string = String(itemData.type);
                if (type && this.itemTemplateMap.has(type)) {
                    this.itemDataList.push(new ScrollListViewData(itemData));
                    let node = this.loadItem(index + i);
                    nodeList.push(node);
                }
            }
            return nodeList;
        }
        else {
            return items;
        }
    }

    loadItem(index: number): Node {
        //console.log("loadItem index:" + index);

        if (this.initWithTemplate) {
            let itemData = this.itemDataList[index];
            if (!itemData) return null;

            let type = String(itemData.data.type);
            let newItem = this.itemPoolMap.get(type).get();
            if (!newItem) {
                newItem = instantiate(this.itemTemplateMap.get(type));
            }
            newItem.active = true;

            if (this._onUpdateItem) {
                this._onUpdateItem(newItem, itemData.data, index);
            }

            return newItem;
        }
        else {
            if (this._onLoadItem)
                return this._onLoadItem(index);
        }
    }

    unloadItem(index: number, item: Node): void {
        //console.log("unloadItem index:" + index);

        if (this.initWithTemplate) {
            let type: string = this.itemTemplateNameTypeMap.get(item.name);
            if (type) {
                this.itemPoolMap.get(type).put(item);
            }
        }
        else {
            if (this._onUnloadItem)
                this._onUnloadItem(item, index);
            else {
                item.removeFromParent();
            }
        }
    }

    updateItem(index: number, currentItem: Node, newItem: Node | any): Node {
        if (newItem instanceof Node) {
            newItem.setPosition(currentItem.position);
            newItem.parent = currentItem.parent;
            if (this._onUnloadItem)
                this._onUnloadItem(currentItem, index);
            else
                currentItem.removeFromParent();
            return newItem;
        }
        else {
            // 仅更新数据
            if (!currentItem) {
                let itemData = this.itemDataList[index];
                itemData.data = newItem;
                return null;
            }

            let itemData = this.itemDataList[index];
            if (!newItem) {
                newItem = itemData.data;
                if (!newItem) return null;
            }
            else {
                itemData.data = newItem;
            }

            // 模版变换
            let newType: string = String(newItem.type);
            if (newType != this.getItemType(currentItem)) {
                let newItem = this.loadItem(index);
                newItem.setPosition(currentItem.position);
                newItem.parent = currentItem.parent;
                this.unloadItem(index, currentItem);
                return newItem;
            }

            // 更新
            if (this._onUpdateItem)
                this._onUpdateItem(currentItem, newItem, index);

            return currentItem;
        }
    }

    updateItemData(index: number, data: any): void {
        let itemData = this.itemDataList[index];
        if (itemData) {
            itemData.data = data;
        }
    }

    insertItem(index: number, newItem: Node | { type: number | string }): Node {
        if (newItem instanceof Node) {
            return newItem;
        }
        else {
            let type: string = String(newItem.type);
            if (type && this.itemTemplateMap.has(type)) {
                this.itemDataList.splice(index, 0, new ScrollListViewData(newItem));
                let node = this.loadItem(index);
                return node;
            }
        }
    }

    removeItem(index: number, item: Node): void {
        this.unloadItem(index, item);
        this.itemDataList.splice(index, 1);
    }
}

/** 滚动视图列表管理 */
@ccclass('brief.ScrollListView')
@help('https://app.gitbook.com/s/VKw0ct3rsRsFR5pXyGXI/gong-neng-jie-shao/ui-zu-jian-yu-kuo-zhan/scrolllistview')
@executeInEditMode
@menu('Brief/UI/ScrollListView')
export class ScrollListView extends Component {

    //#region 组件属性
    @property({
        type: ScrollView,
        readonly: true,
        tooltip: '滚动视图'
    })
    private scrollView: ScrollView = null;

    @property({
        type: Node,
        readonly: true,
        tooltip: '滚动视图可视区域'
    })
    private view: Node = null;

    @property({
        type: Node,
        readonly: true,
        tooltip: '滚动视图内容'
    })
    private content: Node = null;

    @property({
        type: Enum(ScrollViewDirectionType),
        readonly: true,
        tooltip: '滚动视图方向',
    })
    public direction: ScrollViewDirectionType = ScrollViewDirectionType.VERTICAL;

    @property({
        type: CCInteger, min: 1, step: 1,
        tooltip: '滚动检测单元(值越小检测频率越高)',
    })
    scrollUnit = 50;

    @property({
        type: CCInteger, min: 1, step: 1,
        tooltip: '预加载滚动检测单元数量(值越大提前判断越早)',
    })
    preloadScrollUnitCount: number = 1;

    @property({
        min: 0,
        visible: function () { return this.direction === ScrollViewDirectionType.HORIZONTAL; }
    })
    paddingLeft: number = 0;
    @property({
        min: 0,
        visible: function () { return this.direction === ScrollViewDirectionType.HORIZONTAL; }
    })
    paddingRight: number = 0;

    @property({
        min: 0,
        tooltip: "相邻子节点之间水平间距",
        visible: function () { return this.direction === ScrollViewDirectionType.HORIZONTAL; }
    })
    spacingX: number = 0;

    @property({
        min: 0,
        visible: function () { return this.direction === ScrollViewDirectionType.VERTICAL; }
    })
    paddingTop: number = 0;
    @property({
        min: 0,
        visible: function () { return this.direction === ScrollViewDirectionType.VERTICAL; }
    })
    paddingBottom: number = 0;

    @property({
        min: 0,
        tooltip: "相邻子节点之间垂直间距",
        visible: function () { return this.direction === ScrollViewDirectionType.VERTICAL; }
    })
    spacingY: number = 0;

    @property({
        type: [ScrollListViewTemplateData],
        tooltip: '模版数据列表',
    })
    itemTemplates: ScrollListViewTemplateData[] = [];
    //#endregion

    /** 内容项信息保存列表 */
    private itemInfoList: ScrollListViewInfo[] = [];
    /** 项加载管理 */
    private itemLoadManager: ScrollListViewItemManager = null;

    onRestore(): void {
        this.checkEditorComponents();
    }

    protected onLoad(): void {
        //super.onLoad();
        this.checkEditorComponents();
    }

    protected onDestroy(): void {
        this.itemLoadManager?.dispose();
    }

    private checkEditorComponents(): void {
        if (!this.scrollView) {
            this.scrollView = this.node.getComponent(ScrollView);
            if (!this.scrollView) {
                error('ScrollViewContent: scrollView is null');
            }
        }

        if (!this.view) {
            this.view = this.scrollView.node.getChildByName('view');
            if (!this.view) {
                error('ScrollViewContent: view is null');
            }

            this.view.getComponent(UITransform).setContentSize(this.scrollView.node.getComponent(UITransform).contentSize);
        }

        if (!this.content) {
            this.content = this.view.getChildByName('content');
            if (!this.content) {
                error('ScrollViewContent: content is null');
            }

            this.content.getComponent(UITransform).setContentSize(this.view.getComponent(UITransform).contentSize);
        }

        let childrenCount = this.content.children.length;
        if (this.itemTemplates.length == 0 && childrenCount > 0) {
            for (let i = 0; i < childrenCount; i++) {
                let templateData = new ScrollListViewTemplateData();
                templateData.template = this.content.children[i];
                templateData.type = this.content.children[i].name;
                this.itemTemplates.push(templateData);
            }
        }

        this.direction = this.scrollView.vertical ? ScrollViewDirectionType.VERTICAL : ScrollViewDirectionType.HORIZONTAL;
    }

    /** 
     * 初始化
     @param onLoad 加载回调
     @param onLoadItem 加载项通知
     @param onUnloadItem 卸载项通知(可选,默认为移除节点)
     */
    init(onLoad: (type: ScrollListViewEvent, index: number) => any[],
        onLoadItem: (index: number) => Node,
        onUnloadItem?: (item: Node, index: number) => void
    ): void {

        let noticeItem = new ScrollListViewItemManager(false,
            onLoad, onLoadItem, onUnloadItem, null);
        this.itemLoadManager = noticeItem;

        this.initBase();
    }

    /** 
     * 初始化(使用模版数据回调)
     @param onLoad 加载回调
     @param onUpdateItem 更新节点通知
     @param templates 模版数据(可选,默认使用编辑器上面的模版数据)
     */
    initWithTemplate(onLoad: (type: ScrollListViewEvent, index: number) => { type: number | string }[],
        onUpdateItem: (item: Node, data: { type: number | string }, index: number) => void,
        templates?: ScrollListViewTemplateData[]
    ): void {

        let noticeItem = new ScrollListViewItemManager(true,
            onLoad, null, null, onUpdateItem);
        this.itemLoadManager = noticeItem;
        if (templates) {
            //noticeItem.setTemplate(templates);
            this.itemTemplates = templates;
        }
        noticeItem.setTemplate(this.itemTemplates);

        this.initBase();
    }

    /** 重置滚动视图列表 */
    resetItems() {
        this.itemInfoList = [];
        this.content.removeAllChildren();
        this.itemLoadManager.resetData();

        // 默认触发加载
        this.loadMoreDataWithAsync();
    }

    /**
     * 内容项数据更新
     @param index 内容节点索引
     @param item 内容节点数据
     */
    updateItem(index: number, item: Node | any): void {
        if (index < 0 || index >= this.itemInfoList.length) {
            //console.log(`ScrollViewContent: updateItem index out of range ${index}`);
            return;
        }

        let info = this.itemInfoList[index];
        if (!info) return;
        if (!info.item) return;

        // 节点有可能被修改，这里需要重置
        info.item = this.itemLoadManager.updateItem(index, info.item, item);
    }

    /**
     * 从指定位置插入项
     * @param index 插入位置
     * @param item 插入项
     * @returns 
     */
    insertItem(index: number, item: Node | any) {
        if (index < 0 || index >= this.itemInfoList.length) {
            //console.log(`ScrollViewContent: updateItem index out of range ${index}`);
            return;
        }

        let newItem = this.itemLoadManager.insertItem(index, item);
        if (!newItem) return;

        this.insertContentNewItem(index, newItem);
    }

    /**
     * 删除指定位置的项
     * @param index 删除位置
     * @returns 
     */
    removeItem(index: number) {
        if (index < 0 || index >= this.itemInfoList.length) {
            //console.log(`ScrollViewContent: updateItem index out of range ${index}`);
            return;
        }

        let info = this.itemInfoList[index];
        if (!info) return;
        if (!info.item) return;

        this.itemLoadManager.removeItem(index, info.item);
        this.removeContentItem(index);
    }

    private _viewUnit: number = 0;
    private initBase() {
        // 初始化数据
        this.content.removeAllChildren();

        // 移除layout
        let layout = this.content.getComponent(Layout);
        if (layout) {
            layout.destroy();
        }

        this.direction = this.scrollView.vertical ? ScrollViewDirectionType.VERTICAL : ScrollViewDirectionType.HORIZONTAL;

        // 方法注册
        if (this.direction == ScrollViewDirectionType.VERTICAL) {
            this.scrollView.node.on('scroll-to-top', this.onScrollToRefresh, this);
            this.scrollView.node.on('scroll-to-bottom', this.onScrollToLoadMore, this);
            this.scrollView.node.on('scrolling', this.onScrollingWithVertical, this);
            this._viewUnit = Math.ceil(this.scrollView.node.getComponent(UITransform).height / this.scrollUnit);
        }
        else {
            this.scrollView.node.on('scroll-to-left', this.onScrollToRefresh, this);
            this.scrollView.node.on('scroll-to-right', this.onScrollToLoadMore, this);
            this.scrollView.node.on('scrolling', this.onScrollingWithHorizontal, this);
            this._viewUnit = Math.ceil(this.scrollView.node.getComponent(UITransform).width / this.scrollUnit);
        }

        // 初始化完成，加载更多数据
        this.loadMoreDataWithAsync();
    }

    private onScrollToRefresh(scrollView: ScrollView) {
        // console.log('ScrollListView onScrollToRefresh');
        this.itemLoadManager.refresh();
    }

    private onScrollToLoadMore(scrollView: ScrollView) {
        // console.log('ScrollListView onScrollToLoadMore');

        // 这里修改为 onScrolling 判断加载
        // this.itemLoadManager.onLoad(ScrollListViewLoad.MORE, this.itemInfoList.length - 1);
    }

    private _offsetYUnit = 0;
    private onScrollingWithVertical(scrollView: ScrollView) {
        //console.log('scrollingWithVertical ' + scrollView.getScrollOffset().y);
        let offsetYUnit = Math.floor(scrollView.getScrollOffset().y / this.scrollUnit);
        if (offsetYUnit < 0)
            offsetYUnit = 0;
        // 单元滚动通知
        if (offsetYUnit != this._offsetYUnit) {
            this._offsetYUnit = offsetYUnit;
            this.refreshScrollItem();

            // 判断是否正在加载更多
            let checkLoadUnit = Math.floor(this.content.getComponent(UITransform).height / this.scrollUnit) - this.preloadScrollUnitCount - this._viewUnit;
            if (offsetYUnit >= checkLoadUnit) {
                // 判断是否有更多数据
                this.loadMoreDataWithAsync();
            }
        }
    }

    private _offsetXUnit = 0;
    private onScrollingWithHorizontal(scrollView: ScrollView) {
        // console.log('scrollingWithHorizontal ' + scrollView.getScrollOffset().x);
        let offsetXUnit = Math.floor(-scrollView.getScrollOffset().x / this.scrollUnit);
        if (offsetXUnit < 0)
            offsetXUnit = 0;
        // 单元滚动通知
        if (offsetXUnit != this._offsetXUnit) {
            this._offsetXUnit = offsetXUnit;
            this.refreshScrollItem();

            // 判断是否正在加载更多
            let checkLoadUnit = Math.floor(this.content.getComponent(UITransform).width / this.scrollUnit) - this.preloadScrollUnitCount - this._viewUnit;
            if (offsetXUnit >= checkLoadUnit) {
                // 判断是否有更多数据
                this.loadMoreDataWithAsync();
            }
        }
    }

    private _isRefreshScrollItem = false;
    /** 刷新滚动节点(保持渲染节点数量) */
    private async refreshScrollItem(): Promise<void> {

        if (this._isRefreshScrollItem) return;
        this._isRefreshScrollItem = true;

        let unitViewEnd = 0;
        let unitViewBegin = 0;
        if (this.direction == ScrollViewDirectionType.VERTICAL) {
            // 可视范围 0 ~ viewUnit
            unitViewEnd = this._offsetYUnit + this._viewUnit + this.preloadScrollUnitCount;
            unitViewBegin = this._offsetYUnit - this.preloadScrollUnitCount;
        }
        else {
            // 可视范围 0 ~ viewUnit
            unitViewEnd = this._offsetXUnit + this._viewUnit + this.preloadScrollUnitCount;
            unitViewBegin = this._offsetXUnit - this.preloadScrollUnitCount;
        }

        this.itemInfoList.forEach(itemInfo => {
            if (itemInfo.unitIndex >= unitViewBegin && itemInfo.unitIndex <= unitViewEnd) {
                // 判断是否已经加载
                if (!itemInfo.item) {
                    itemInfo.item = this.itemLoadManager.loadItem(itemInfo.index);
                    itemInfo.item.position = itemInfo.position;
                    this.content.addChild(itemInfo.item);
                }
            }
            else {
                // 释放内容项
                if (itemInfo.item) {
                    this.itemLoadManager.unloadItem(itemInfo.index, itemInfo.item);
                    itemInfo.item = null;
                }
            }
        });

        this._isRefreshScrollItem = false;
    }

    private isLoading = false;
    /** 加载更多数据 */
    private async loadMoreDataWithAsync(): Promise<void> {
        if (this.isLoading) return;
        this.isLoading = true;

        let lastIndex = this.itemInfoList.length - 1;
        let items = this.itemLoadManager.loadMore(lastIndex);
        if (items && items.length > 0) {
            for (let i = 0; i < items.length; i++) {
                this.pushContentNewItem(items[i]);
            }
        }

        this.isLoading = false;
    }

    /** 创建内容项信息(判断更内容大小) */
    private pushContentNewItem(item: Node): void {
        // 计算位置,并重新调整内容大小
        let lastInfo = this.itemInfoList[this.itemInfoList.length - 1];
        let unitIndex = 0;
        let itemTransform = item.getComponent(UITransform);
        let contentTransform = this.content.getComponent(UITransform);
        if (this.direction == ScrollViewDirectionType.VERTICAL) {
            if (lastInfo) {
                let ptY = -lastInfo.position.y + lastInfo.size.height * lastInfo.anchorY + itemTransform.height * itemTransform.anchorY + this.spacingY;
                let maxY = ptY + itemTransform.height * (1 - itemTransform.anchorY) + this.paddingBottom;
                if (maxY !== contentTransform.height) {
                    contentTransform.height = maxY;
                }

                item.position = v3(0, - ptY);
            }
            else {
                item.position = v3(0, -itemTransform.height * itemTransform.anchorY - this.paddingTop);
            }

            unitIndex = Math.floor((-item.position.y - itemTransform.height * itemTransform.anchorY) / this.scrollUnit);
        }
        else {
            if (lastInfo) {
                let ptX = lastInfo.position.x + lastInfo.size.width * lastInfo.anchorX + itemTransform.width * itemTransform.anchorX + this.spacingX;
                let maxX = ptX + itemTransform.width * (1 - itemTransform.anchorX) + this.paddingRight;
                if (maxX != contentTransform.width) {
                    contentTransform.width = maxX;
                }

                item.position = v3(ptX, 0);
            }
            else {
                item.position = v3(itemTransform.width * itemTransform.anchorX + this.paddingLeft, 0);
            }

            unitIndex = Math.floor((item.position.x - itemTransform.width * itemTransform.anchorX) / this.scrollUnit);
        }

        // 创建内容项信息
        let itemInfo = new ScrollListViewInfo();
        itemInfo.index = this.itemInfoList.length;
        itemInfo.unitIndex = unitIndex;
        itemInfo.item = item;
        itemInfo.position = item.position;
        itemInfo.size = itemTransform.contentSize;
        itemInfo.anchorX = itemTransform.anchorX;
        itemInfo.anchorY = itemTransform.anchorY;
        this.itemInfoList.push(itemInfo);

        this.content.addChild(item);
    }

    /** 插入内容项(更新容器大小) */
    private insertContentNewItem(index: number, item: Node): void {
        if (index < 0 || index > this.itemInfoList.length) return;
        // 计算位置,并重新调整内容大小
        let insertInfo = index > 0 ? this.itemInfoList[index - 1] : null;
        let unitIndex = 0;
        let itemTransform = item.getComponent(UITransform);
        let contentTransform = this.content.getComponent(UITransform);
        if (this.direction == ScrollViewDirectionType.VERTICAL) {
            if (insertInfo) {
                let ptY = -insertInfo.position.y + insertInfo.size.height * insertInfo.anchorY + itemTransform.height * itemTransform.anchorY + this.spacingY;
                item.position = v3(0, - ptY);
            }
            else {
                item.position = v3(0, -itemTransform.height * itemTransform.anchorY - this.paddingTop);
            }

            unitIndex = (-item.position.y - itemTransform.height * itemTransform.anchorY) / this.scrollUnit;
        }
        else {
            if (insertInfo) {
                let ptX = insertInfo.position.x + insertInfo.size.width * insertInfo.anchorX + itemTransform.width * itemTransform.anchorX + this.spacingX;
                item.position = v3(ptX, 0);
            }
            else {
                item.position = v3(itemTransform.width * itemTransform.anchorX + this.paddingLeft, 0);
            }

            unitIndex = (item.position.x - itemTransform.width * itemTransform.anchorX) / this.scrollUnit;
        }

        // 创建内容项信息
        let itemInfo = new ScrollListViewInfo();
        itemInfo.unitIndex = unitIndex;
        itemInfo.item = item;
        itemInfo.position.x = item.position.x;
        itemInfo.position.y = item.position.y;
        itemInfo.size = itemTransform.contentSize;
        itemInfo.anchorX = itemTransform.anchorX;
        itemInfo.anchorY = itemTransform.anchorY;
        this.itemInfoList.splice(index, 0, itemInfo);

        this.content.addChild(item);

        // 重新调整其它内容项位置
        this.offsetBeginItem(index);

        // 重新调整容器大小
        if (this.direction == ScrollViewDirectionType.VERTICAL) {
            let lastInfo = this.itemInfoList[this.itemInfoList.length - 1];
            let maxY = -lastInfo.position.y + lastInfo.size.height * (1 - lastInfo.anchorY) + this.paddingBottom;
            if (maxY != contentTransform.height) {
                contentTransform.height = maxY;
            }
        }
        else {
            let lastInfo = this.itemInfoList[this.itemInfoList.length - 1];
            let maxX = lastInfo.position.x + lastInfo.size.width * (1 - lastInfo.anchorX) + this.paddingRight;
            if (maxX != contentTransform.width) {
                contentTransform.width = maxX;
            }
        }
    }

    /** 删除内容项(更新容器大小) */
    private removeContentItem(index: number): void {
        // 重新调整其它内容项位置
        this.offsetBeginItem(index, false);

        this.itemInfoList.splice(index, 1);

        let contentTransform = this.content.getComponent(UITransform);
        // 重新调整容器大小
        if (this.direction == ScrollViewDirectionType.VERTICAL) {
            let lastInfo = this.itemInfoList[this.itemInfoList.length - 1];
            let maxY = -lastInfo.position.y + lastInfo.size.height * (1 - lastInfo.anchorY) + this.paddingBottom;
            if (maxY != contentTransform.height) {
                contentTransform.height = maxY;
            }
        }
        else {
            let lastInfo = this.itemInfoList[this.itemInfoList.length - 1];
            let maxX = lastInfo.position.x + lastInfo.size.width * (1 - lastInfo.anchorX) + this.paddingRight;
            if (maxX != contentTransform.width) {
                contentTransform.width = maxX;
            }
        }
    }

    /** 重新调整后续节点位置 */
    private offsetBeginItem(index: number, isAdd = true): void {
        let tagItem = this.itemInfoList[index].item;
        let itemTransform = tagItem.getComponent(UITransform);
        // 重新调整后续节点位置
        for (let i = index + 1; i < this.itemInfoList.length; i++) {
            let info = this.itemInfoList[i];
            if (!info) continue;

            if (this.direction == ScrollViewDirectionType.VERTICAL) {
                let offset = itemTransform.height + this.spacingY;
                if (!isAdd)
                    offset = -offset;
                info.position.y -= offset;
                info.unitIndex = (-info.position.y - info.size.height * info.anchorY) / this.scrollUnit;
                if (info.item) {
                    info.item.position = info.item.position.add3f(0, -offset, 0);
                }
            }
            else {
                let offset = itemTransform.width + this.spacingX;
                if (!isAdd)
                    offset = -offset;
                info.position.x += offset;
                info.unitIndex = (info.position.x - info.size.width * info.anchorX) / this.scrollUnit;
                if (info.item) {
                    info.item.position = info.item.position.add3f(offset, 0, 0);
                }
            }
        }
    }
}