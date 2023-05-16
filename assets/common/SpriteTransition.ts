/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-05-12 17:43
 */

import { _decorator, color, Component, ImageAsset, Node, resources, Sprite, SpriteFrame, Texture2D, UITransform } from 'cc';
import { EDITOR } from 'cc/env';
const { ccclass, help, menu, property } = _decorator;

const _images = [
    'transitions/001-Blind01',
    'transitions/002-Blind02',
    'transitions/003-Blind03',
    'transitions/004-Blind04',
    'transitions/005-Stripe01',
    'transitions/006-Stripe02',
    'transitions/007-Line01',
    'transitions/008-Line02',
    'transitions/009-Random01',
    'transitions/010-Random02',
    'transitions/011-Random03',
    'transitions/012-Random04',
    'transitions/013-Square01',
    'transitions/014-Square02',
    'transitions/015-Diamond01',
    'transitions/016-Diamond02',
    'transitions/017-Brick01',
    'transitions/018-Brick02',
    'transitions/019-Whorl01',
    'transitions/020-Flat01',
];
const _image_background = 'transitions/Background';
const _image_width = 640;
const _image_height = 480;

/**
 * 精灵过渡类型
 */
export enum SpriteTransitionType {
    Random = 0,
    Blind01,
    Blind02,
    Blind03,
    Blind04,
    Stripe01,
    Stripe02,
    Line01,
    Line02,
    Random01,
    Random02,
    Random03,
    Random04,
    Square01,
    Square02,
    Diamond01,
    Diamond02,
    Brick01,
    Brick02,
    Whorl01,
    Flat01,
}

/**
 * 精灵过渡状态
 */
export enum SpriteTransitionState {
    /** 显示（从透明到黑色背景） */
    Show = 0,
    /** 隐藏（从黑色背景到透明） */
    Hide,
}

/**
 * 精灵过渡特效
 */
@ccclass('SpriteTransition')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/common/spritetransition')
@menu('Brief/Common/SpriteTransition')
export class SpriteTransition extends Component {
    /**
     * 过渡速度（最小值为1，值越大速度越快）
     */
    @property({
        tooltip: '过渡速度（最小值为1，值越大速度越快）',
        min: 1,
        step: 1,
    })
    speed = 5;

    private _sprite: Sprite = null;
    private _pixelData: PixelSwitcherData = null;
    private _isRunning = false;
    private _iterator: Generator<Uint8ClampedArray, void, unknown>;

    protected start() {}

    protected update(deltaTime: number) {
        if (this._iterator) {
            let result = this._iterator.next();
            if (result.done) {
                this._iterator = null;
                this._isRunning = false;

                this._resolve?.(true);
                this._resolve = null;

            } else {
                if (result.value) {
                    ImageUtil.setSpriteData(this._sprite, result.value, this._pixelData.width, this._pixelData.height);
                }
            }
        }
    }

    private _isInitData = false;
    private async initData() {
        if (this._isInitData) return;

        // UITransform组件初始化
        let uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            uiTransform = this.node.addComponent(UITransform);
        }
        uiTransform.width = _image_width;
        uiTransform.height = _image_height;

        // 检查精灵组件初始化
        this._sprite = this.node.getComponent(Sprite);
        if (!this._sprite) {
            this._sprite = this.node.addComponent(Sprite);
        }
        this._sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        this._sprite.type = Sprite.Type.SIMPLE;
        this._sprite.trim = true;
        this._sprite.color = color(255, 255, 255, 0);

        // PixelSwitcherData 初始化
        this._pixelData = {
            width: _image_width,
            height: _image_height,
            showData: null,
            transitionData: null,
        } as PixelSwitcherData;

        if (EDITOR) return;

        let spriteFrame = await ImageUtil.loadSpriteFrame(_image_background);
        if (!spriteFrame) {
            console.error(`加载图片资源失败：${_image_background}`);
            return;
        }
        this._sprite.spriteFrame = spriteFrame;

        let imageAsset = await ImageUtil.loadImageAsset(_image_background);
        this._pixelData.showData = ImageUtil.getPixelData(imageAsset);

        this._isInitData = true;
    }

    private async getTransitionData(type: SpriteTransitionType) {
        let index = type - 1;
        if (index < 0) {
            index = Math.floor(Math.random() * _images.length);
        }
        let imageAsset = await ImageUtil.loadImageAsset(_images[index]);
        return ImageUtil.getPixelData(imageAsset);
    }

    private _resolve: Function = null;
    /**
     * 运行过渡特效
     * @param type 类型
     * @param state 状态
     * @param speed 速度（最小值为1，值越大速度越快）
     * @returns Promise<boolean> 是否运行成功
     */
    async run(type: SpriteTransitionType, state: SpriteTransitionState = SpriteTransitionState.Show, speed?: number) {
        if (!this._isInitData) {
            await this.initData();
        }

        return new Promise<boolean>(async (resolve, reject) => {
            if (this._isRunning) {
                return resolve(false);
            }
            this._isRunning = true;

            if (speed == undefined) {
                speed = this.speed;
            }

            this.getTransitionData(type).then((transitionData) => {
                this._pixelData.transitionData = transitionData;
                this._sprite.color = color(255, 255, 255, 255);
                let iterator = new PixelSwitcherIterator(this._pixelData, state, speed);
                this._iterator = iterator.fillIterator();
            });

            this._resolve = resolve;
        });
    }
}

//#region ImageUtil
/** 图片工具类 */
class ImageUtil {
    /**
     * 加载精灵帧资源
     * @param path 图片路径（不包含后缀，相对路径从resources子目录算起）
     * @returns Promise<SpriteFrame> 精灵帧资源
     */
    public static async loadSpriteFrame(path: string): Promise<SpriteFrame> {
        return new Promise<SpriteFrame>((resolve, reject) => {
            resources.load(`${path}/spriteFrame`, SpriteFrame, (err: any, spriteFrame: SpriteFrame) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(spriteFrame);
                }
            });
        });
    }

    /**
     * 加载二位纹理资源
     * @param path 图片路径（不包含后缀，相对路径从resources子目录算起）
     * @returns Promise<Texture2D> 二位纹理资源
     */
    public static async loadTexture(path: string): Promise<Texture2D> {
        return new Promise<Texture2D>((resolve, reject) => {
            resources.load(`${path}/texture`, Texture2D, (err: any, texture: Texture2D) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(texture);
                }
            });
        });
    }

    /**
     * 加载图片资源
     * @param path 图片路径（不包含后缀，相对路径从resources子目录算起）
     * @returns Promise<ImageAsset> 图片资源
     */
    public static async loadImageAsset(path: string): Promise<ImageAsset> {
        return new Promise<ImageAsset>((resolve, reject) => {
            resources.load(`${path}`, ImageAsset, (err: any, imageAsset: ImageAsset) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(imageAsset);
                }
            });
        });
    }

    /**
     * 获取图片像素数据
     * @param imageAsset 图片资源
     * @returns Uint8ClampedArray 像素数据
     */
    public static getPixelData(imageAsset: ImageAsset | Texture2D | SpriteFrame | Sprite): Uint8ClampedArray {
        let imageBitmap: ImageBitmap = null;
        if (imageAsset instanceof ImageAsset) {
            imageBitmap = imageAsset.data as ImageBitmap;
        } else if (imageAsset instanceof Texture2D) {
            imageBitmap = imageAsset.image.data as ImageBitmap;
        } else if (imageAsset instanceof SpriteFrame) {
            //imageBitmap = imageAsset.texture.image.data as ImageBitmap;
            let texture2D = imageAsset.texture;
            if (texture2D instanceof Texture2D) {
                imageBitmap = texture2D.image.data as ImageBitmap;
            }
            else {
                return null;
            }
        } else if (imageAsset instanceof Sprite) {
            //imageBitmap = imageAsset.spriteFrame.texture.image.data as ImageBitmap;
            let texture2D = imageAsset.spriteFrame.texture;
            if (texture2D instanceof Texture2D) {
                imageBitmap = texture2D.image.data as ImageBitmap;
            }
            else {
                return null;
            }
        }
        if (imageBitmap) {
            let canvas = document.createElement('canvas');
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            let ctx = canvas.getContext('2d');
            ctx.drawImage(imageBitmap, 0, 0);
            let imageData = ctx.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
            let data = imageData.data;
            return data;
        }
        return null;
    }

    /**
     * 更新精灵帧数据（优化：释放资源，防止 GFX Texture 飙升不降的问题）
     * @param sprite 精灵组件
     * @param data 像素数据
     * @param width 图片宽度
     * @param height 图片高度
     */
    public static setSpriteData(sprite: Sprite, data: Uint8ClampedArray, width: number, height: number) {
        let oldTexture = sprite.spriteFrame.texture;

        let texture2D = new Texture2D();
        texture2D.reset({
            width: width,
            height: height,
            format: Texture2D.PixelFormat.RGBA8888,
        });
        texture2D.uploadData(data);
        let spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture2D;
        sprite.spriteFrame = spriteFrame;

        // 需要手动释放资源，否则会导致 GFX Texture 飙升不降的问题
        oldTexture.destroy();
    }
}
//#endregion

//#region PixelSwitcherIterator
interface PixelSwitcherData {
    width: number;
    height: number;
    /** 显示图的像素数据 */
    showData: Uint8ClampedArray;
    /** 动画图的像素数据 */
    transitionData: Uint8ClampedArray;
}

class PixelSwitcherIterator {
    data: PixelSwitcherData;
    type: number;
    speed: number;

    constructor(data: PixelSwitcherData, type: number, speed: number) {
        this.data = data;
        this.type = type;
        this.speed = speed > 0 ? speed : 1;
    }

    * fillIterator() {
        // 将对比图的像素数据分组 0~255
        let compareData = this.data.transitionData;
        let compareDataGroup = [];
        for (let i = 0; i < 256; i++) {
            compareDataGroup.push([]);
        }
        for (let i = 0; i < compareData.length; i += 4) {
            let r = compareData[i + 0];
            // let g = compareData[i + 1];
            // let b = compareData[i + 2];
            // let a = compareData[i + 3];
            // let value = (r + g + b) / 3;
            compareDataGroup[r].push(i);
        }

        let showData = this.data.showData;
        // 根据类型设置初始 透明度
        let color4 = this.type == 0 ? 0 : 255;
        for (let i = 0; i < showData.length; i += 4) {
            showData[i + 3] = color4;
        }

        // 按顺序把显示图的像素数据填充为fillColor
        color4 = this.type == 0 ? 255 : 0;
        const speed = this.speed;
        for (let i = 0; i < compareDataGroup.length; i++) {
            let group = compareDataGroup[i];
            for (let j = 0; j < group.length; j++) {
                let index = group[j];
                showData[index + 0] = 0;
                showData[index + 1] = 0;
                showData[index + 2] = 0;
                showData[index + 3] = color4;
            }

            if (i % speed == 0) {
                yield showData;
            }
        }

        yield showData;
    }
}
//#endregion
