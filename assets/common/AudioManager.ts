/**
 * brief-framework
 * author = vangagh@live.cn
 * editor = vangagh@live.cn
 * update = 2023-02-28 13:48
 */

import { _decorator, Node, AudioClip, AudioSource, Component, director, NodePool, path } from "cc";
import { EDITOR } from "cc/env";
import { brief } from "../Brief";
import { Configuration } from "../base/Configuration";
import { EventMutex } from "../base/EventMutex";
import { ResourcesUtil } from "./ResourcesUtil";
const { ccclass, help, executeInEditMode, menu, property } = _decorator;

const AUDIO_CONFIG = "AUDIO_CONFIG";

/** 本地音频保存结构 */
interface AudioConfig {
    /** 音效开关 */
    switchSound: boolean,
    /** 背景音乐开关 */
    switchMusic: boolean,
    /** 音效音量 */
    volumeSound: number,
    /** 背景音乐音量 */
    volumeMusic: number,
}

/** 音频管理 */
@ccclass('brief.AudioManager')
@help('https://vangagh.gitbook.io/brief-framework-3.7.0/gong-neng-jie-shao/common/audiomanager')
@executeInEditMode
@menu('Brief/Common/AudioManager')
export class AudioManager extends Component {
    //#region instance
    private static _instance: AudioManager = null;
    static get instance() {
        if (this._instance == null) {
            let scene = director.getScene();
            if (!scene) return null;
            this._instance = scene.getComponentInChildren(AudioManager);
            if (!this._instance) {
                console.log("AudioManager not found, create new one");
                let newNode = new Node("AudioManager");
                scene.addChild(newNode);
                this._instance = newNode.addComponent(AudioManager);
            }
            director.addPersistRootNode(this._instance.node);
        }
        return this._instance;
    }
    //#endregion

    @property({
        type: AudioClip,
        tooltip: "默认背景音乐文件",
    })
    private musicClip: AudioClip = null;

    @property({
        tooltip: "启动播放背景音乐",
    })
    private playOnLoad: boolean = true;

    /** 背景音乐的AudioSource */
    private _musicAudioSource: AudioSource;
    /** 一次性音效AudioSource */
    private _oneShotAudioSource: AudioSource;
    /** 音效SoundAudioSource表 */
    private _soundAudioSourceMap: Map<number, AudioSource>;
    /** 缓存音频文件 */
    private _audioClipDict: Map<string, AudioClip>;

    /** 背景音乐声音（0.0 ~ 1.0） */
    private _volumeMusic = 1;
    /** 背景音乐开关 */
    private _switchMusic: boolean;

    /** 音效声音（0.0 ~ 1.0） */
    private _volumeSound = 1;
    /** 音效开关 */
    private _switchSound: boolean;

    protected onLoad(): void {
        if (EDITOR) return;

        brief.audio = this;

        this._soundAudioSourceMap = new Map<number, AudioSource>();
        this._audioClipDict = new Map<string, AudioClip>();

        // 从配置中读取音频配置
        let audioSetting = this.loadAudioConfig();
        this._volumeSound = audioSetting.volumeSound;
        this._volumeMusic = audioSetting.volumeMusic;
        this._switchSound = audioSetting.switchSound;
        this._switchMusic = audioSetting.switchMusic;

        // 初始化背景音乐音频组件
        this._musicAudioSource = this.node.addComponent(AudioSource);

        // 初始化短音频音频组件
        this._oneShotAudioSource = this.node.addComponent(AudioSource);

        // 初始化配置背景音乐
        if (this.musicClip) {
            this._musicAudioSource.clip = this.musicClip;
            this._musicAudioSource.loop = true;
            this._musicAudioSource.volume = this._volumeMusic;
            if (this.playOnLoad) {
                this._musicAudioSource.play();
            }
        }
    }

    /**
     * 播放背景音乐
     * @param music 背景音乐或路径，音频路径（不包含后缀，相对路径从resources子目录算起）
     * @param loop 是否循环（默认循环）
     * @returns 
     */
    async playMusic(music: AudioClip | string, loop: boolean = true): Promise<void> {
        if (!music) return;

        this._musicAudioSource?.stop();

        if (typeof music == "string") {
            music = await this.getOrCreateAudioClip(music);
            if (!music) return;
        }

        this._musicAudioSource.clip = music;
        this._musicAudioSource.volume = this._volumeMusic;
        this._musicAudioSource.loop = loop;
        if (this._switchMusic) {
            this._musicAudioSource.play();
        }
        else {
            this._musicAudioSource.stop();
        }
    }

    /**
     * 转换音乐播放开关
     * @param isSwitch 
     * @returns 
     */
    switchMusic(isSwitch?: boolean): boolean {
        if (isSwitch == null || isSwitch == undefined) {
            this._switchMusic = !this._switchMusic;
        }
        else {
            if (this._switchMusic == isSwitch) return this._switchMusic;
            this._switchMusic = isSwitch;
        }

        if (this._musicAudioSource.clip == null) {
            console.log("未设置背景音乐");
            this._switchMusic = false;
            return false;
        }

        if (this._switchMusic) {
            if (!this._musicAudioSource.playing)
                this._musicAudioSource.play();
        }
        else {
            if (this._musicAudioSource.playing)
                this._musicAudioSource.stop();
        }
        this.saveAudioConfig();

        return this._switchMusic;
    }

    /**
     * 获取音乐播放开关状态
     * @returns 
     */
    getSwitchMusic() {
        return this._switchMusic;
    }

    /**
     * 暂停背景音乐
     */
    pauseMusic() {
        this._musicAudioSource.pause();
    }

    /**
     * 恢复当前被暂停背景音乐
     */
    resumeMusic() {
        this._musicAudioSource.play();
    }

    /**
     * 停止背景音乐
     */
    stopMusic() {
        this._musicAudioSource.stop();
    }

    /**
     * 设置背景音乐音量
     * @param volume （0.0 ~ 1.0）
     */
    setMusicVolume(volume: number) {
        this._volumeMusic = volume;
        this._musicAudioSource.volume = volume;
        this.saveAudioConfig();
    }

    getMusicVolume(): number {
        return this._volumeMusic;
    }

    /**
     * 是否当前背景音乐正在播放
     */
    isMusicPlaying(): boolean {
        return this._musicAudioSource.playing;
    }

    /** 
     * 以指定音量倍数播放一个音频一次（过程不再接管）
     * @param path 音频路径（不包含后缀，相对路径从resources子目录算起）
     * @param volumeScale 音量倍数（0.0 ~ 1.0）
     */
    async playOneShot(path: string, volumeScale?: number): Promise<void> {
        if (this._switchSound) {
            let audioClip = await this.getOrCreateAudioClip(path);
            if (audioClip) {
                this._oneShotAudioSource.playOneShot(audioClip, volumeScale || this._volumeSound);
            }
        }
    }

    /** 音效id计数器 */
    private _soundIdCounter = 0;
    /** 音效事件锁 */
    private _playEventMutex = new EventMutex(1);
    /**
     * 播放音效
     * @param path 音频路径（不包含后缀，相对路径从resources子目录算起）
     * @param onStop 停止播放回调
     * @param volumeScale 音量倍数（0.0 ~ 1.0）
     * @param loop 是否循环（默认不循环）
     * @returns Promise<string> 音效id, 用于后续管理（返回-1表示播放失败）
     */
    async playSound(path: string, onStop?: Function, volumeScale?: number, loop: boolean = false): Promise<number> {
        if (this._switchSound == false) {
            return -1;
        }

        await this._playEventMutex.wait();
        let soundId = ++this._soundIdCounter;
        let item = this.createSoundAudioSource(soundId, onStop);
        item.clip = await this.getOrCreateAudioClip(path);
        item.volume = volumeScale || this._volumeSound;
        item.loop = loop;
        item.play();
        this._playEventMutex.notify();
        return soundId;
    }

    /**
     * 转换音效播放开关(仅关闭正在播放的音效)
     * @param isSwitch 
     * @returns 
     */
    switchSound(isSwitch?: boolean): boolean {
        if (isSwitch == null || isSwitch == undefined) {
            this._switchSound = !this._switchSound;
        }
        else {
            if (this._switchSound == isSwitch) return this._switchSound;
            this._switchSound = isSwitch;
        }

        if (!this._switchSound) {
            for (const item of this._soundAudioSourceMap.values()) {
                this.stopSoundAudioSource(item);
            }
        }
        this.saveAudioConfig();
        return this._switchSound;
    }

    /**
     * 获取音效播放开关状态
     * @returns 
     */
    getSwitchSound(): boolean {
        return this._switchSound;
    }

    /**
     * 设置音效音量
     * @param volume 0.0 - 1.0
     */
    setSoundVolume(volume: number) {
        this._volumeSound = volume;
        // 设置音效声音大小
        for (const item of this._soundAudioSourceMap.values()) {
            item.volume = volume;
        }

        this.saveAudioConfig();
    }

    /**
     * 获取音效音量
     * @returns 0.0 - 1.0
     */
    getSoundVolume(): number {
        return this._volumeSound;
    }

    /**
     * 暂停指定音效
     * @param soundId 音效id
     */
    pauseSound(soundId: number) {
        let item = this._soundAudioSourceMap.get(soundId);
        if (item && item.playing) {
            item.pause();
        }
    }

    /**
     * 暂停正在播放的所有音效
     */
    pauseAllSounds() {
        for (const item of this._soundAudioSourceMap.values()) {
            if (item.playing) {
                item.pause();
            }
        }
    }

    /**
     * 恢复指定音效
     * @param soundId 音效id
     */
    resumeSound(soundId: number) {
        let item = this._soundAudioSourceMap.get(soundId);
        if (item && !item.playing) {
            item.play();
        }
    }

    /**
     * 恢复被暂停播放的所有音效
     */
    resumeAllSounds() {
        for (const item of this._soundAudioSourceMap.values()) {
            if (!item.playing) {
                item.play();
            }
        }
    }

    /**
     * 停止播放指定音效
     * @param soundId 音效id
     */
    stopSound(soundId: number) {
        let item = this._soundAudioSourceMap.get(soundId);
        if (item) {
            this.stopSoundAudioSource(item);
        }
    }

    /**
     * 停止正在播放的所有音效
     */
    stopAllSounds() {
        for (const item of this._soundAudioSourceMap.values()) {
            this.stopSoundAudioSource(item);
        }
    }

    /** 释放所有使用过的音效资源 */
    releaseAllAudioClip() {
        for(let path in this._audioClipDict) {
            ResourcesUtil.release(path);
        }
        this._audioClipDict.clear();
    }

    private async getOrCreateAudioClip(path: string): Promise<AudioClip> {
        if (this._audioClipDict[path] == null) {
            this._audioClipDict[path] = await ResourcesUtil.getAudioClip(path);
        }

        return this._audioClipDict[path];
    }

    private _audioSourceNodePool: NodePool = new NodePool("AUDIO_SOUND_NODE_POOL");
    private createSoundAudioSource(soundId: number, onStop?: Function): AudioSource {
        let newNode = this._audioSourceNodePool.get();
        if (!newNode) {
            newNode = new Node();
            newNode.addComponent(AudioSource);
            this.node.addChild(newNode);
        }
        //newNode.off(AudioSource.EventType.ENDED);
        // 播放结束后回收
        newNode.once(AudioSource.EventType.ENDED, () => {
            let item = this._soundAudioSourceMap.get(soundId);
            if (item) {
                onStop?.();
                this._soundAudioSourceMap.delete(soundId);
                // test
                // console.log(`size = ${this._soundAudioSourceMap.size}`);
            }
            this._audioSourceNodePool.put(newNode);
        }, this);

        let audioSource = newNode.getComponent(AudioSource)
        this._soundAudioSourceMap.set(soundId, audioSource);
        return audioSource;
    }

    private stopSoundAudioSource(item: AudioSource) {
        item.stop();
        item.node.emit(AudioSource.EventType.ENDED);
    }

    private loadAudioConfig(): AudioConfig {
        let audio: AudioConfig;
        let localAudio = Configuration.instance.getItem(AUDIO_CONFIG);
        if (localAudio == null || localAudio == undefined || localAudio == "") {
            audio = { switchSound: true, switchMusic: true, volumeSound: 1, volumeMusic: 1 };
        }
        else {
            audio = JSON.parse(localAudio);
        }
        return audio;
    }

    private saveAudioConfig() {
        let audio: AudioConfig = { switchSound: this._switchSound, switchMusic: this._switchMusic, volumeSound: this._volumeSound, volumeMusic: this._volumeMusic };
        Configuration.instance.setItem(AUDIO_CONFIG, JSON.stringify(audio));
    }
}