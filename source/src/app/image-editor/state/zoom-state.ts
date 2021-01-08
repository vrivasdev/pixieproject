import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store';
import { 
    SetZoomLayer, 
    UpdateZoom, 
    UpdateMovement 
} from './zoom-state-actions';
export interface ZoomStateModel {
    zoomLayers: [
        {
            data: any,
            src: string,
            scaleX: number,
            scaleY: number,
            width: number,
            height: number,
            left: number,
            top: number,
            angle: number,
            name: string,
            type: string,
            zoomLevel: number,
            movementX: number,
            movementY: number
        }
    ]
}
@State({
    name: 'zoomLayers',
    defaults: {
        zoomLayers: []
    }
})
export class ZoomState {
    @Selector()
    static getZoomLayers(state: ZoomStateModel) {
        return state.zoomLayers;
    }
    @Action(SetZoomLayer)
    setZoomLayer(ctx: StateContext<ZoomStateModel>, action: SetZoomLayer) {
        const layersState = ctx.getState().zoomLayers;
        let layers;
        if (layersState.some(object => object.data.id === action.data.id)) {
            layers = layersState.filter(object => object.data.id !== action.data.id);
            layers.push(action);
        } else {
            layers = layersState;
            layers.push(action);
        }
        console.log('____ set zoom layers ____', layers);
        ctx.patchState({zoomLayers: layers});
    }
    @Action(UpdateZoom)
    updateZoom(ctx: StateContext<ZoomStateModel>, action: SetZoomLayer) {
        const layers = ctx.getState().zoomLayers;
        const newLayers: any = [];

        layers.forEach(object => {
            if (object.data.id === action.data.id) {
                object.zoomLevel = action.zoomLevel;
            }
            newLayers.push(object);
        });
        ctx.patchState({zoomLayers: newLayers}); 
    }
    @Action(UpdateMovement)
    updateMovement(ctx: StateContext<ZoomStateModel>, action: UpdateMovement) {
        const layers = ctx.getState().zoomLayers;
        const newLayers: any = [];

        layers.forEach(object => {
            if (object.data.id === action.id) {
                object.movementX = action.movementX;
                object.movementY = action.movementY;
            }
            newLayers.push(object);
        });
        ctx.patchState({zoomLayers: newLayers});
    }
}