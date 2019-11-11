import { MappingType } from './mapping-type.enum';
import { State, Action, StateContext } from '@ngxs/store';
import { SetMapping } from './mapping-state-actions';

interface MappingStateModel {
    objects: [{'objectId': String, 'type': MappingType, 'field': String}];
}

@State({
    name: 'mapping',
    defaults: {
        objects: []
    }
})
export class MappingState {
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
}
