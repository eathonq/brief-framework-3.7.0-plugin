/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-01-30 16:14
 */

import { Node, SpriteFrame, resources, Texture2D, Sprite, JsonAsset, assetManager, AssetManager, AudioClip } from "cc";

/** 资源工具 */
export class ResourcesUtil {
    private static _bundleName: string;
    /**
     * 绑定分包
     * @info 当默认资源也需要分包时使用，避免大量改动资源加载方式
     * @param name 分包名称
     */
    static bindBundle(name: string) {
        this._bundleName = name;
    }

    /**
     * 获取图片
     * @param path 图片路径（不包含后缀，相对路径从resources子目录算起）
     * @param formate 加载格式 spriteFrame 或者 texture （默认 spriteFrame）
     * @returns Promise<SpriteFrame>
     */
    static async getSpriteFrame(path: string, formate = "spriteFrame"): Promise<SpriteFrame> {
        if (!path || path.trim() === '') return null;

        if (this._bundleName) {
            return BundleUtil.getSpriteFrame(this._bundleName, path, formate);
        }

        if (formate == "spriteFrame") {
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
        else if (formate == "texture") {
            return new Promise<SpriteFrame>((resolve, reject) => {
                resources.load(`${path}/texture`, Texture2D, (err: any, texture: Texture2D) => {
                    if (err) {
                        resolve(null);
                    } else {
                        let spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;
                        resolve(spriteFrame);
                    }
                });
            });
        }
    }

    /**
     * 设置精灵图片
     * @param node 精灵节点或者精灵组件
     * @param path 图片路径（不包含后缀，相对路径从resources子目录算起）
     * @param formate 加载格式 spriteFrame 或者 texture （默认 spriteFrame）
     */
    static setSprite(node: Node | Sprite, path: string, formate = "spriteFrame"): void {
        this.getSpriteFrame(path, formate).then((spriteFrame: SpriteFrame) => {
            if (!spriteFrame) return;

            if (node instanceof Node) {
                let sprite: Sprite = node.getComponent(Sprite);
                if (!sprite) {
                    sprite = node.addComponent(Sprite);
                }
                sprite.spriteFrame = spriteFrame;
            }
            else {
                node.spriteFrame = spriteFrame;
            }
        });
    }

    /**
     * 获取音频
     * @param path 音频路径（不包含后缀，相对路径从resources子目录算起）
     * @returns Promise<AudioClip>
     */
    static async getAudioClip(path: string): Promise<AudioClip> {
        if (!path || path.trim() === '') return null;

        if (this._bundleName) {
            return BundleUtil.getAudioClip(this._bundleName, path);
        }

        return new Promise<AudioClip>((resolve, reject) => {
            resources.load(path, (err: any, res: AudioClip) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(res);
                }
            });
        });
    }

    /**
     * 获取json
     * @param path json路径（不包含后缀，相对路径从resources子目录算起）
     * @returns Promise<any>
     */
    static async getJson<T = any>(path: string): Promise<T> {
        if (!path || path.trim() === '') return null;

        if (this._bundleName) {
            return BundleUtil.getJson(this._bundleName, path);
        }

        return new Promise<T>((resolve, reject) => {
            resources.load(path, (err: any, res: JsonAsset) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(res.json as T);
                }
            });
        });
    }

    /**
     * 释放资源
     * @param path 资源路径（不包含后缀，相对路径从resources子目录算起）
     */
    static release(path: string) {
        if (!path || path.trim() === '') return;

        if (this._bundleName) {
            BundleUtil.release(this._bundleName, path);
        } else {
            resources.release(path);
        }
    }
}

/** 分包资源工具 */
export class BundleUtil {

    private static _bundleMap: Map<string, AssetManager.Bundle> = new Map<string, AssetManager.Bundle>();
    /**
     * 加载分包
     * @param nameOrUrl 分包名称或者url 
     * @param name 分包别名
     * @returns Promise<void>
     */
    static load(nameOrUrl: string, name?: string) {
        let key = name || nameOrUrl;
        if (this._bundleMap.has(key)) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            assetManager.loadBundle(nameOrUrl, (err, bundle) => {
                if (err) {
                    return reject(err);
                }
                this._bundleMap.set(key, bundle);
                resolve();
            });
        });
    }

    /**
     * 移除分包
     * @param name 分包名称 
     */
    static remove(name: string) {
        let bundle = this._bundleMap.get(name);
        if (bundle) {
            assetManager.removeBundle(bundle);
            this._bundleMap.delete(name);
        }
    }

    /**
     * 获取图片
     * @param name 分包名称
     * @param path 图片路径（不包含后缀，相对路径从分包子目录算起）
     * @param formate 加载格式 spriteFrame 或者 texture （默认 spriteFrame）
     * @returns Promise<SpriteFrame>
     */
    static async getSpriteFrame(name: string, path: string, formate = "spriteFrame"): Promise<SpriteFrame> {
        let bundle = this._bundleMap.get(name);
        if (!bundle) {
            return null;
        }

        if (formate == "spriteFrame") {
            return new Promise<SpriteFrame>((resolve, reject) => {
                bundle.load(`${path}/spriteFrame`, SpriteFrame, (err: any, spriteFrame: SpriteFrame) => {
                    if (err) {
                        resolve(null);
                    } else {
                        resolve(spriteFrame);
                    }
                });
            });
        }
        else if (formate == "texture") {
            return new Promise<SpriteFrame>((resolve, reject) => {
                bundle.load(`${path}/texture`, Texture2D, (err: any, texture: Texture2D) => {
                    if (err) {
                        resolve(null);
                    } else {
                        let spriteFrame = new SpriteFrame();
                        spriteFrame.texture = texture;
                        resolve(spriteFrame);
                    }
                });
            });
        }
    }

    /**
     * 设置精灵图片
     * @param name 分包名称
     * @param node 精灵节点或者精灵组件
     * @param path 图片路径（不包含后缀，相对路径从分包子目录算起）
     * @param formate 加载格式 spriteFrame 或者 texture （默认 spriteFrame）
     */
    static setSprite(name: string, node: Node | Sprite, path: string, formate = "spriteFrame"): void {
        this.getSpriteFrame(name, path, formate).then((spriteFrame) => {
            if (!spriteFrame) return;

            if (node instanceof Node) {
                let sprite: Sprite = node.getComponent(Sprite);
                if (!sprite) {
                    sprite = node.addComponent(Sprite);
                }
                sprite.spriteFrame = spriteFrame;
            }
            else {
                node.spriteFrame = spriteFrame;
            }
        });
    }

    /**
     * 获取音频
     * @param name 分包名称
     * @param path 音频路径（不包含后缀，相对路径从分包子目录算起）
     * @returns Promise<AudioClip>
     */
    static async getAudioClip(name: string, path: string): Promise<AudioClip> {
        let bundle = this._bundleMap.get(name);
        if (!bundle) {
            return null;
        }

        return new Promise<AudioClip>((resolve, reject) => {
            bundle.load(path, (err: any, res: AudioClip) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(res);
                }
            });
        });
    }

    /**
     * 获取json
     * @param name 分包名称
     * @param path json路径（不包含后缀，相对路径从分包子目录算起）
     * @returns Promise<any>
     */
    static async getJson(name: string, path: string): Promise<any> {
        let bundle = this._bundleMap.get(name);
        if (!bundle) {
            return null;
        }

        return new Promise<any>((resolve, reject) => {
            bundle.load(`${path}`, (err: any, res: JsonAsset) => {
                if (err) {
                    resolve(null);
                } else {
                    resolve(res.json);
                }
            });
        });
    }

    /**
     * 释放资源
     * @param name 分包名称
     * @param path 资源路径（不包含后缀，相对路径从分包子目录算起）
     */
    static release(name: string, path: string) {
        let bundle = this._bundleMap.get(name);
        if (!bundle) {
            return;
        }

        bundle.release(path);
    }
}