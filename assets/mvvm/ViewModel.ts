/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-03-02 8:56
 */

import { _decorator, Component, Enum, CCClass } from "cc";
import { EDITOR } from "cc/env";
import { reactive } from "../base/ReactiveObserve";
import { Locator } from "../common/Locator";
import { DataContext } from "./DataContext";
import { decoratorData } from './MVVM';
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

@ccclass("brief.ViewModel")
@help("https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/mvvm/viewmodel")
@executeInEditMode
@menu("Brief/MVVM/ViewModel")
export class ViewModel extends DataContext {

    @property
    protected _viewModelName = ""; // 挂载 @property 属性值保存到场景等资源文件中，用于数据恢复
    get viewModelName() {
        return this._viewModelName;
    }

    protected _viewModelEnums: { name: string, value: number }[] = [];
    private _viewModel = 0;
    @property({
        type: Enum({}),
        tooltip: "视图模型",
    })
    get viewModel() {
        return this._viewModel;
    }
    set viewModel(value) {
        this._viewModel = value;
        if (this._viewModelEnums[value]) {
            this._viewModelName = this._viewModelEnums[value].name;
            this.selectedViewModel();
        }
    }

    //#region EDITOR
    onRestore() {
        this.checkEditorComponent();
        this.bindingType = this._viewModelName;
        this.path = this.bindingType;
    }

    protected checkEditorComponent() {
        this.updateEditorViewModelEnums();
    }

    private updateEditorViewModelEnums() {
        // 设置绑定属性
        const newEnums = [];
        let dataList = decoratorData.getViewModelList(this.node.name);
        if (dataList) {
            for (let i = 0; i < dataList.length; i++) {
                const data = dataList[i];
                newEnums.push({ name: data.name, value: i });
            }
        }
        // 更新绑定数据枚举
        this._viewModelEnums = newEnums;
        CCClass.Attr.setClassAttr(this, "viewModel", "enumList", newEnums);

        // 如果绑定数据枚举为空，则警告
        if (newEnums.length == 0) {
            console.warn(`PATH ${Locator.getNodeFullPath(this.node)} 组件 ViewModel 绑定未找到合适的数据`);
        }

        // 设置绑定数据枚举默认值
        if (this._viewModelName !== "") {
            let findIndex = newEnums.findIndex((item) => { return item.name === this._viewModelName });
            if (findIndex !== -1) {
                this.viewModel = findIndex;
                return;
            }
        }
        this.viewModel = 0;
    }

    private selectedViewModel() {
        this.bindingType = this._viewModelName;
        this.path = this.bindingType;
    }

    //#endregion

    protected onLoad() {
        this.checkEditorComponent();
        this.isRoot = true;
        this.bindingType = this._viewModelName;
        this.path = this.bindingType;
        this.parent = this;

        super.onLoad();

        if (EDITOR) return;

        let data = decoratorData.createViewModel(this._viewModelName);
        if (!data) {
            console.error(`ViewModel: ${this.constructor.name} onLoad data is null`);
            return;
        }

        this._data = reactive(data);
    }
}