import { MappingType } from './mapping-type.enum';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { SetMapping, UpdateObjectId } from './mapping-state-actions';
import { Map } from './map.enum';

export interface MappingStateModel {
    objects: [{'objectId': String, 'type': MappingType, 'field': String, 'map': Map}];
}

@State({
    name: 'mapping',
    defaults: {
        objects: []
    }
})
export class MappingState {
    @Selector()
    static getMappingObjects(state: MappingStateModel) {
        return state.objects;
    }

    @Action(SetMapping)
    setMapping(ctx: StateContext<MappingStateModel>, action: SetMapping) {
        const objectsState = ctx.getState().objects;
        let objects: any;

        if (objectsState.filter(object => object.objectId === action.objectId).length) {
            objects = objectsState.filter(object => object.objectId !== action.objectId);
            objects.push(action);
        } else {
            objects = objectsState;
            objects.push(action);
        }

        ctx.patchState({objects: objects});
    }

    @Action(UpdateObjectId)
    updateObjectId(ctx: StateContext<MappingStateModel>, action: UpdateObjectId){
        const objectsState = ctx.getState().objects;
        const tempObject = objectsState.filter(object => object.objectId === action.objectId);
        
        if (tempObject.length) {
            let objects: any = [];
            
            objects = objectsState.filter(object => object.objectId !== action.objectId);
            objects.push(
                {
                   objectId: action.id,
                   type:  tempObject[0].type,
                   field: tempObject[0].field,
                   map: tempObject[0].map
                }
            );
            ctx.patchState({objects: objects});
        }
    }
}
