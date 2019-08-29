import { Action, State, StateContext, Store, Selector } from '@ngxs/store';
import { ObjectName } from './objects-panel.enum';
import { BlockObject } from './objects-panel.actions';

export interface ObjectsPanelStateModel {
    blockedObject: [{'id': string, 'object': ObjectName}];
}

@State({
    name: 'ObjectState',
    defaults: {
        blockedObject: []
    }
})

export class ObjectPanelState {
    @Selector()
    static blockedObject(state: ObjectsPanelStateModel) {
        return state.blockedObject;
    }

    constructor(private store: Store) {}

    @Action(BlockObject)
    BlockObject(ctx: StateContext<ObjectsPanelStateModel>, action: BlockObject) {
        let objects: any = [];
        let flag: string = 'init';

        if (Object.values(ctx.getState().blockedObject).length >= 1 ) {
            objects = ctx.getState()
                         .blockedObject.map(item => {
                             if (item.id === action.id) {
                                if (item.object === 'clear') {
                                    console.log('block', item.id, item.object);
                                    return {'id': action.id, 'object': action.object};
                                } else {
                                    console.log(' is not clear', item.id, item.object);
                                   return {'id': action.id, 'object': 'clear'};
                                }
                             } else {
                                return item;
                             }
                         });
        } else {
            objects = [{'id': action.id, 'object': action.object}];
        }
        console.log(flag, objects);
        ctx.patchState({
            blockedObject: flag === 'concat' ? objects.concat({'id': action.id, 'object': action.object}) : objects
        });
    }
}
