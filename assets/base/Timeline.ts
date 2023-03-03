/** 时间轴类 */
class Timeline{
    /** 时间轴的当前时间 */
    private _time: number = 0;

    /**
     * 初始化时间轴
     * @param ms 每帧的时间间隔，默认1000/10
     */
    init(ms?:number){
        this._time = Date.now();
        setInterval(this.onUpdate.bind(this), ms || 1000 / 10);
    }

    private onUpdate(){
        let interval = Date.now() - this._time;
        this._time = Date.now();
    }

    
}

export const timeline = new Timeline();