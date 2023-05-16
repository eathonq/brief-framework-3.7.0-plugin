/** websocket client */
export class WebSocketClient {
    /**
     * 构造函数
     * @param url websocket地址 
     * @param key websocket key
     */
    constructor(url: string, key = 'client') {
        this._url = url;
        this._key = key;
    }

    private _url: string;
    /** websocket地址 */
    get url(): string {
        return this._url;
    }
    private _key: string;
    /** websocket key */
    get key(): string {
        return this._key;
    }

    protected _ws?: WebSocket;
    /** websocket */
    get ws(): WebSocket {
        return this._ws as WebSocket;
    }

    private _onopen?: Function;
    /** 开启回调 */
    set onopen(value: () => void) {
        this._onopen = value;
    }

    private _onclose?: Function;
    /** 关闭回调 */
    set onclose(value: () => void) {
        this._onclose = value;
    }

    private _onerror?: Function;
    /** 错误回调 */
    set onerror(value: () => void) {
        this._onerror = value;
    }

    private _onmessage?: Function;
    /** 所有消息回调 */
    set onmessage(value: (msg: string) => void) {
        this._onmessage = value;
    }

    private onOpen(event: Event) {
        this._onopen?.();

        if (this._openOnce) {
            this._openOnce();
            this._openOnce = undefined;
        }
    }

    private onClose(event: CloseEvent) {
        this._onclose?.();

        if (this._closeOnce) {
            this._closeOnce();
            this._closeOnce = undefined;
        }

        // 通知所有 caller 回调，并清空
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
    }

    private onError(event: Event) {
        this._onerror?.();

        // 通知所有 caller 回调，并清空
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
    }

    private onMessage(event: MessageEvent) {
        this._onmessage?.(event.data);

        let json = JSON.parse(event.data);
        if (json.type) {
            // 通知类型 caller 回调，并清空
            let list = this._callerList[json.type];
            if (list && list.length > 0) {
                for (let i = 0; i < list.length; i++) {
                    let call = list[i];
                    if (call) {
                        call(json.data);
                    }
                }
                this._callerList[json.type] = [];
                // 如果是 caller 类型，不再往下执行
                return;
            }

            // 通知类型 listener 回调
            list = this._listenerList[json.type];
            if (list && list.length > 0) {
                for (let i = 0; i < list.length; i++) {
                    let call = list[i];
                    if (call) {
                        call(json.data);
                    }
                }
            }
        }
    }

    protected bindWebSocket(ws: WebSocket) {
        this._ws = ws;
        this._ws.onopen = this.onOpen.bind(this);
        this._ws.onclose = this.onClose.bind(this);
        this._ws.onerror = this.onError.bind(this);
        this._ws.onmessage = this.onMessage.bind(this);
    }

    private _openOnce?: Function;
    /** 开启 */
    open(): Promise<void> {
        if (this._ws) {
            this._ws.close();
            this.onClose(new CloseEvent(''));
        }

        this.bindWebSocket(new WebSocket(this._url));

        return new Promise<void>((resolve) => {
            this._openOnce = resolve;
        });
    }

    private _closeOnce?: Function;
    /** 关闭 */
    close(): Promise<void> {
        if (this._ws) {
            this._ws.close();
            this._ws = undefined;
        }

        return new Promise<void>((resolve) => {
            this._closeOnce = resolve;
        });
    }

    /**
     * 发送消息
     * @info 在 onmessage 接收消息
     * @param data 消息内容
     */
    send(data: string) {
        this._ws?.send(data);
    }

    /**
     * 发送消息
     * @param type 消息类型 
     * @param data 消息内容
     */
    sendMsg(type: string, data?: any) {
        this._ws?.send(JSON.stringify({ type, data }));
    }

    private _callerList: { [key: string]: Function[] } = {};
    /**
     * 发送消息并等待返回
     * @param type 消息类型
     * @param data 消息内容
     * @returns 返回消息内容
     */
    callMsg<T = any>(type: string, data?: any): Promise<T> {
        return new Promise<T>((resolve) => {
            let array = this._callerList[type];
            if (!array) {
                array = [];
                this._callerList[type] = array;
            }
            array.push((data: any) => {
                resolve(data);
            });

            this._ws?.send(JSON.stringify({ type, data }));
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