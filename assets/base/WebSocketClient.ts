/** websocket client */
export class WebSocketClient {
    /**
     * 构造函数
     * @param url websocket地址 
     * @param key websocket key
     */
    constructor(url: string, key?: string) {
        this._url = url;
        this._key = key;
    }

    private _url: string;
    get url(): string {
        return this._url;
    }
    private _key: string;
    get key(): string {
        return this._key;
    }

    private _ws: WebSocket;
    get ws(): WebSocket {
        return this._ws;
    }

    private _onopen: () => void;
    /** 开启回调 */
    set onopen(value: () => void) {
        this._onopen = value;
    }

    private _onclose: () => void;
    /** 关闭回调 */
    set onclose(value: () => void) {
        this._onclose = value;
    }

    private _onerror: () => void;
    /** 错误回调 */
    set onerror(value: () => void) {
        this._onerror = value;
    }

    private _onmessage: (msg: string) => void;
    /** 所有消息回调 */
    set onmessage(value: (msg: string) => void) {
        this._onmessage = value;
    }

    private onOpen(event: Event) {
        this._onopen?.();
    }

    private onClose(event: CloseEvent) {
        this._onclose?.();

        for (let key in this._callerList) {
            let list = this._callerList[key];
            if (list) {
                for (let i = 0; i < list.length; i++) {
                    let call = list[i];
                    if (call) {
                        call(null);
                    }
                }
            }
        }
        this._callerList = {};

        for (let key in this._listenerList) {
            let list = this._listenerList[key];
            if (list) {
                for (let i = 0; i < list.length; i++) {
                    let call = list[i];
                    if (call) {
                        call(null);
                    }
                }
            }
        }
    }

    private onError(event: Event) {
        this._onerror?.();

        for (let key in this._callerList) {
            let list = this._callerList[key];
            if (list) {
                for (let i = 0; i < list.length; i++) {
                    let call = list[i];
                    if (call) {
                        call(null);
                    }
                }
            }
        }
        this._callerList = {};

        for (let key in this._listenerList) {
            let list = this._listenerList[key];
            if (list) {
                for (let i = 0; i < list.length; i++) {
                    let call = list[i];
                    if (call) {
                        call(null);
                    }
                }
            }
        }
    }

    private onMessage(event: MessageEvent) {
        this._onmessage?.(event.data);

        let json = JSON.parse(event.data);
        if (json.type) {
            let list = this._callerList[json.type];
            if (list && list.length > 0) {
                for (let i = 0; i < list.length; i++) {
                    let call = list[i];
                    if (call) {
                        call(json.data);
                    }
                }
                this._callerList[json.type] = [];
            }

            list = this._listenerList[json.type];
            if (list) {
                for (let i = 0; i < list.length; i++) {
                    let call = list[i];
                    if (call) {
                        call(json.data);
                    }
                }
            }
        }
    }

    /** 开启 */
    open() {
        if (this._ws) {
            this._ws.close();
        }

        this._ws = new WebSocket(this._url);
        this._ws.onopen = this.onOpen.bind(this);
        this._ws.onclose = this.onClose.bind(this);
        this._ws.onerror = this.onError.bind(this);
        this._ws.onmessage = this.onMessage.bind(this);

        this._callerList = {};
    }

    /**
     * 发送消息
     * @info 在 onmessage 接收消息
     * @param data 消息内容
     */
    send(data: string) {
        this._ws.send(data);
    }

    /** 关闭 */
    close() {
        this._ws.close();
        this._ws = null;
    }

    /**
     * 发送消息
     * @param type 消息类型 
     * @param data 消息内容
     */
    sendMsg(type: string, data?: any) {
        this._ws.send(JSON.stringify({ type, data }));
    }

    private _callerList: { [key: string]: Function[] } = {};
    /**
     * 发送消息并等待返回
     * @param type 消息类型
     * @param data 消息内容
     * @returns 返回消息内容
     */
    callMsg<T>(type: string, data?: any): Promise<T> {
        return new Promise<T>((resolve) => {
            let array = this._callerList[type];
            if (!array) {
                array = [];
                this._callerList[type] = array;
            }
            array.push((data: any) => {
                resolve(data);
            });

            this._ws.send(JSON.stringify({ type, data }));
        });
    }

    private _listenerList: { [key: string]: Function[] } = {};
    /**
     * 监听消息
     * @param type 消息类型 
     * @param callback 监听函数
     */
    listenMsg(type: string, callback: (data?: any) => void) {
        if (!this._listenerList[type]) {
            this._listenerList[type] = [];
        }
        this._listenerList[type].push(callback);
    }

    /**
     * 取消监听消息
     * @param type 消息类型
     * @param callback 监听函数
     */
    unlistenMsg(type: string, callback?: (data?: any) => void) {
        if (callback) {
            let index = this._listenerList[type].indexOf(callback);
            if (index >= 0) {
                this._listenerList[type].splice(index, 1);
            }
        } else {
            this._listenerList[type] = [];
        }
    }
}