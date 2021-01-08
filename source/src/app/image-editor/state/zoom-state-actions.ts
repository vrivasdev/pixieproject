export class SetZoomLayer {
    static readonly type = '[Editor] Set Zoom Layer';
    constructor(
        public data: any,
        public zoomLevel: number,
        public src?: string,
        public scaleX?: number,
        public scaleY?: number,
        public width?: number,
        public height?: number,
        public left?: number,
        public top?: number,
        public angle?: number,
        public name?: string,
        public type?: string,
        public movementX?: number,
        public movementY?: number
    ) {}
}

export class UpdateZoom {
    static readonly type = '[Editor] Update Zoom';
    constructor(
        public data: any,
        public zoomLevel: number
    ) {}
}

export class UpdateMovement {
    static readonly type = '[Editor] Update Zoom movement';
    constructor(
        public id: string,
        public movementX: number,
        public movementY: number
    ) {}
}