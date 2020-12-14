import { Store } from '@ngxs/store';
import { Injectable } from '@angular/core';
import { IMouseEvent } from 'fabric/fabric-impl';
import { CanvasStateService } from './canvas-state.service';
import { MappingState } from 'app/image-editor/state/mapping-state';
import { Settings } from '../../../common/core/config/settings.service';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';

@Injectable()
export class CanvasPanService {
    private lastPosX = 0;
    private lastPosY = 0;
    private lastE: MouseEvent|TouchEvent;
    private isDragging  = false;
    private clientX: number = 0;
    private clientY: number = 0;
    private isScale: boolean = false;

    constructor(
        private state: CanvasStateService,
        private config: Settings,
        private store: Store,
        private active: ActiveObjectService
    ) {}

    public set(e?: MouseEvent|TouchEvent) {        
        // use last stored event, if no event is given
        // used for re-adjusting pan during zoom
        if ( ! e) e = this.lastE;
        if ( ! e) return;

        const wrapper = this.state.calcWrapperSize();

        const fabricWidth = this.state.fabric.getWidth(),
            fabricHeight = this.state.fabric.getHeight();

        const coords = this.getClientCoords(e);

        let left = this.state.fabric.viewportTransform[4] + coords.clientX - this.lastPosX;
        let top = this.state.fabric.viewportTransform[5] + coords.clientY - this.lastPosY;

        if (left > 0 || wrapper.width > fabricWidth) {
            left = 0;
        } else if (left + Math.floor(fabricWidth) - wrapper.width < 0) {
            left = wrapper.width - Math.floor(fabricWidth);
        }

        if (top > 0 || wrapper.height > fabricHeight) {
            top = 0;
        } else if (top + Math.floor(fabricHeight) - wrapper.height < 0) {
            top = wrapper.height - Math.floor(fabricHeight);
        }

        this.state.fabric.viewportTransform[4] = left;
        this.state.fabric.viewportTransform[5] = top;
        this.state.fabric.requestRenderAll();

        this.lastPosX = coords.clientX;
        this.lastPosY = coords.clientY;
        this.lastE = e;
    }

    /**
     * Reset canvas pan to original state.
     */
    public reset() {
        this.lastPosX = 0;
        this.lastPosY = 0;
        this.lastE = null;
        this.state.fabric.viewportTransform[4] = 0;
        this.state.fabric.viewportTransform[5] = 0;
    }

    public init() {
        this.state.fabric.on('mouse:down', opt => {
            // if object is being dragged or draw mode is enabled, bail
            if (opt.target || this.state.fabric.isDrawingMode) {
                return this.isDragging = false;
            }

            const coords = this.getClientCoords(opt.e);
            
            this.isDragging = true;
            this.lastPosX = coords.clientX;
            this.lastPosY = coords.clientY;
        });
        
        this.state.fabric.on('object:scaling', event => {
            const e: any = event.e;
            if (!this.isScale) {
                if ('screenX' in e) this.clientX = e.clientX; 
                if ('screenY' in e) this.clientY = e.clientY;                
                this.isScale = true;
            }
        })

        this.state.fabric.on('mouse:move', opt => {
            if (this.isDragging) {
                this.set(opt.e);
            }
            // block object if user is an agent
            if (opt.target && !this.config.get('pixie.isAdmin')) {
                this.blockObject(opt);
            }
        });

        this.state.fabric.on('mouse:up', (opt) => {
            this.isDragging = false;
        });
    }

    private blockObject(e: IMouseEvent) {
        const objects = this.store.selectSnapshot(MappingState.getMappingObjects);
        const active = this.active.get();
        const event: any = e.e;

        e.target.lockMovementX = true;
        e.target.lockMovementY = true;
        e.target.lockRotation  = true;
        
        if ('data' in e.target) {
            if (objects.some(object => object.objectId === e.target.data.id)) {
                if (this.isScale && (this.clientX < event.clientX || this.clientY > event.clientY)) {
                    e.target.lockScalingX  = true
                } else {
                    e.target.lockScalingX  = false;
                }
            } else {
                e.target.lockScalingX  = true;
                e.target.lockScalingY  = true;
            }
        }        
    }

    /**
     * Get client coordinates from touch or mouse event.
     */
    private getClientCoords(e: MouseEvent|TouchEvent) {
        let clientX = 0,
            clientY = 0;

        e = e as TouchEvent;

        if (e.touches && e.touches[0]) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e['clientX'];
            clientY = e['clientY'];
        }

        return {clientX, clientY};
    }
}