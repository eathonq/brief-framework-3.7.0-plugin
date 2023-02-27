import { EventTarget } from 'cc';

import { AudioManager } from "./cocos/AudioManager";
import { MessageBox } from "./cocos/MessageBox";
import { Tooltip } from "./cocos/Tooltip";
import { ViewManager } from "./cocos/ViewManager";
import { ResourcesUtil, BundleUtil } from "./cocos/ResourcesUtil";
import { Locator } from "./cocos/Locator";
import { I18n } from "./i18n/I18n";
import { CameraFollow } from "./expand/CameraFollow";
import { SkinManager } from "./expand/SkinSprite";
import { GuideManager } from "./guide/GuideManager";
import { DataTarget } from "./cocos/DataTarget";

/** brief cocos 模块便捷访问入口 */
export class brief {

    /** 
     * 视图管理
     * @example
     * brief.view.show('home'); // 显示视图
     * brief.view.show('home', { name: '张三' }); // 显示视图，并传递参数
     * brief.view.close('home'); // 关闭视图
     */
    static view: ViewManager;

    /** 
     * 音频管理
     * @example
     * brief.audio.playMusic('sounds/music'); // 播放背景音乐
     * brief.audio.playSound('sounds/sound'); // 播放音效
     */
    static audio: AudioManager;

    /** 
     * 数据目标
     * @example
     * dataTarget.on("add", (a, b) => {
     *     return a + b;
     * });
     * let data = dataTarget.add(1, 2);  // 3
     * dataTarget.off("add");
     * 
     * let object = { a: 0 };
     * dataTarget.on("a", { target: object, attr: "a" });
     * dataTarget.a = 100; // a = 100
     * let data = dataTarget.a; // data = 100
     * dataTarget.off("a");
     */
    static dataTarget = new DataTarget();

    /**
     * 事件目标
     * @url https://docs.cocos.com/creator/manual/zh/engine/event/event-emit.html?h=event
     * @example
     * eventTarget.on(GameEvent.EVENT_NAME, this.callback, this);
     * eventTarget.emit(GameEvent.EVENT_NAME, 'Hello World');
     * eventTarget.off(GameEvent.EVENT_NAME, this.callback, this);
     */
    static eventTarget = new EventTarget();

    /** 
     * 消息框
     * @example
     * brief.messageBox.show('提示内容'); // 显示消息框
     * brief.messageBox.show('提示内容', '标题'); // 显示消息框
     * brief.messageBox.dialog('提示框类型名称', { content: '提示内容' }); // 显示消息框
     * brief.messageBox.close('提示框类型名称'); // 关闭消息框
     */
    static messageBox = MessageBox;

    /** 
     * 提示框
     * @example
     * brief.tooltip.show('提示内容'); // 显示提示框
     * brief.tooltip.show('提示内容', 3); // 显示提示框，3秒后自动关闭
     * brief.tooltip.tip('提示框类型名称', { content: '提示内容' }); // 显示提示框
     * brief.tooltip.close('提示框类型名称'); // 关闭提示框
     */
    static tooltip = Tooltip;

    /** 
     * 资源
     * @example
     * await brief.res.getSpriteFrame('images/home'); // 获取图片
     * brief.res.setSprite(node, 'images/home'); // 设置图片
     * await brief.res.getAudioClip('sounds/music'); // 获取音频
     * await brief.res.getJson('config/config'); // 获取json
     */
    static res = ResourcesUtil;

    /** 
     * 分包资源
     * @example
     * await brief.bundle.getSpriteFrame('b1','images/home'); // 获取图片
     * brief.bundle.setSprite('b1',node, 'images/home'); // 设置图片
     * await brief.bundle.getAudioClip('b1','sounds/music'); // 获取音频
     * await brief.bundle.getJson('b1','config/config'); // 获取json
     */
    static bundle = BundleUtil;

    /** 
     * 定位器
     * @example
     * let node = await brief.locator.locateNode(this.node, 'Content/Label'); // 等价于 this.node.getChildByName('Content').getChildByName('Label')
     * let node = await brief.locator.locateNode(this.node, 'Content>Label2'); // 等价于 this.node.getChildByName('Content').getChildByName('Item').getChildByName('Label2')
     */
    static locator = Locator;

    /** 
     * 国际化
     * @example
     * brief.i18n.t('title_1#10$20$30');  // 获取多语言文本
     * await brief.i18n.s('home');              // 获取多语言图片
     */
    static i18n = I18n.instance;

    /**
     * 皮肤管理
     * @example
     * brief.skin.switchSkin('newYear'); // 切换皮肤
     * brief.skin.setKeyGroup('hero', 'newYear'); // 设置皮肤组
     * brief.skin.getSkinPath('hero'); // 获取皮肤路径
     */
    static skin = SkinManager.instance;

    /**
     * 摄像机跟随
     */
    static cameraFollow: CameraFollow;

    /**
     * 新手引导
     */
    static guide: GuideManager;
}
