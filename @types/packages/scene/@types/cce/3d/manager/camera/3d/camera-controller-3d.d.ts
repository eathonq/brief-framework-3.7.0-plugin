import { ISceneMouseEvent, ISceneKeyboardEvent } from '../../../../../../@types/private';
import CameraControllerBase from '../camera-controller-base';
import LinearTicks from '../grid/linear-ticks';
import { CameraMoveMode } from '../utils';
import { Camera, Color, Quat, Vec3 } from 'cc';
declare enum ModeCommand {
    ToIdle = "toIdle",
    ToPan = "toPan",
    ToOrbit = "toOrbit",
    ToWander = "toWander"
}
export interface ICameraController3DEvent {
    'projection-changed': (projectType: Camera.ProjectionType) => void;
    'mode': (cameraMoveMode: CameraMoveMode) => void;
    'camera-move-mode': (cameraMoveMode: CameraMoveMode) => void;
}
declare class CameraController3D extends CameraControllerBase {
    on<E extends keyof ICameraController3DEvent>(event: E, callback: ICameraController3DEvent[E]): this;
    once<E extends keyof ICameraController3DEvent>(event: E, callback: ICameraController3DEvent[E]): this;
    emit<E extends keyof ICameraController3DEvent>(event: E, ...parameters: Parameters<ICameraController3DEvent[E]>): boolean;
    private v3a;
    private v3b;
    private v3c;
    private v3d;
    protected _wheelSpeed: number;
    protected _near: number;
    protected _far: number;
    private homePos;
    private homeRot;
    private _sceneViewCenter;
    private defaultViewDist;
    viewDist: number;
    private forward;
    private _curRot;
    private _curEye;
    private _lineColor;
    private _modeFSM;
    private _idleMode;
    private _orbitMode;
    private _panMode;
    private _wanderMode;
    isMoving(): boolean;
    view?: number;
    hTicks?: LinearTicks;
    vTicks?: LinearTicks;
    shiftKey?: boolean;
    altKey?: boolean;
    get lineColor(): Color;
    set lineColor(value: Color);
    get sceneViewCenter(): Vec3;
    set sceneViewCenter(value: Vec3);
    get wanderSpeed(): number;
    set wanderSpeed(value: number);
    get enableAcceleration(): boolean;
    set enableAcceleration(value: boolean);
    init(camera: Camera): void;
    private _initMode;
    private _initLinearTick;
    set active(value: boolean);
    changeMode(modeCommand: ModeCommand): void;
    /**
     * ????????????
     */
    reset(): void;
    /**
     * ??????????????????????????????????????????????????????????????????
     * @param {*} viewDist
     */
    updateViewCenterByDist(viewDist: number): void;
    /**
     * ??????
     * @param {*} delta
     */
    scale(delta: number): void;
    /**
     * ????????????????????????
     * ???????????? nodes????????????????????????
     * ??????????????? nodes????????????????????????
     * @param {*} nodes
     */
    focus(nodeUuids?: string[] | null, position?: Vec3, rotation?: Quat, viewCenter?: Vec3, immediate?: boolean): void;
    alignNodeToSceneView(nodeUuids: string[]): void;
    alignSceneViewToNode(nodeUuids: string[]): void;
    onMouseDown(event: ISceneMouseEvent): boolean;
    onMouseMove(event: ISceneMouseEvent): boolean;
    onMouseUp(event: ISceneMouseEvent): boolean;
    onMouseWheel(event: any): void;
    onKeyDown(event: ISceneKeyboardEvent): void;
    onKeyUp(event: ISceneKeyboardEvent): void;
    onUpdate(deltaTime: number): void;
    _updateGridData(positions: number[], colors: number[], lineColor: Color, lineEnd?: number | null): void;
    updateGrid(): void;
    refresh(): void;
    rotateCameraToDir(dir: Vec3): void;
    getDepthSize(): number;
    calcCameraPosInOrtho(): Vec3;
    isOrtho(): boolean;
    setOrthoHeight(newOrthoHeight: number): void;
    changeProjection(): void;
    onResize(): void;
}
export { CameraController3D };
//# sourceMappingURL=camera-controller-3d.d.ts.map