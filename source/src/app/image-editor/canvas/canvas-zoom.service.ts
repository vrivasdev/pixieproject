import {Injectable} from '@angular/core';
import {CanvasPanService} from './canvas-pan.service';
import {CanvasStateService} from './canvas-state.service';
import {Settings} from 'common/core/config/settings.service';
import {Store} from '@ngxs/store';
import {SetZoom} from '../state/editor-state-actions';
import { ZoomState } from '../state/zoom-state';
import { ActiveObjectService } from './active-object/active-object.service';

@Injectable()
export class CanvasZoomService {
    public maxScale = 2;
    public minScale = 0.1;
    public currentZoom = 1;

    constructor(
        private state: CanvasStateService,
        private pan: CanvasPanService,
        private config: Settings,
        private store: Store,
        private activeObject: ActiveObjectService
    ) {}

    public get() {
        return this.currentZoom;
    }

    public getPercent() {
        return Math.floor(this.currentZoom * 100);
    }

    /**
     * Zoom canvas to specified scale.
     */
    public set(scaleFactor: number, resize: boolean = true) {
        if (scaleFactor < this.minScale || scaleFactor > this.maxScale) return;

        const width = this.state.original.width * scaleFactor,
            height = this.state.original.height * scaleFactor;

        this.state.fabric.setZoom(scaleFactor);

        if (resize) {
            this.state.fabric.setHeight(height);
            this.state.fabric.setWidth(width);
        }

        this.currentZoom = scaleFactor;
        this.store.dispatch(new SetZoom(this.getPercent()));
    }

    /**
     * Resize canvas to fit available screen space.
     */
    public fitToScreen() {
        const size = this.state.calcWrapperSize();

        const maxWidth = size.width - 40, maxHeight = size.height - 40;

        if (this.state.original.height > maxHeight || this.state.original.width > maxWidth) {
            const scale = Math.min(maxHeight / this.state.original.height, maxWidth / this.state.original.width);
            this.set(scale);
        }
    }

    public init() {
        if ( ! this.config.get('pixie.ui.allowZoom')) return;
        this.bindMouseWheel();
        this.bindToPinchZoom();
    }

    private bindMouseWheel() {
        this.state.fabric.on('mouse:wheel', opt => {        
            opt.e.preventDefault();
            opt.e.stopPropagation();

            this.pan.set();
            this.state.fabric.requestRenderAll();
        });
    }

    /**
     * Resize canvas when pinch zooming on mobile.
     */
    private bindToPinchZoom() {
        const mc = new Hammer.Manager(this.state.maskWrapperEl);
        const pinch = new Hammer.Pinch();
        mc.add([pinch]);

        mc.on('pinch', (ev: HammerInput) => {
            const step = Math.abs(ev['overallVelocity']);

            if (ev['additionalEvent'] === 'pinchout') {
                this.set(this.get() + step);
            } else {
                this.set(this.get() - step);
            }

            this.pan.set();
            this.state.fabric.requestRenderAll();
        });
    }

    public getZoomLevelById(id: string): number | null {
        const found = this.store.selectSnapshot(ZoomState.getZoomLayers)
                          .filter(layer => layer.data.id === id);
        return found.length? found[0].zoomLevel : null;
    }
}
