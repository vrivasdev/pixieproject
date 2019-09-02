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
        ctx.patchState({
            blockedObject:  ctx.getState().blockedObject.length ?
                            this.setStates(action, ctx.getState()) : [{'id': action.id + '.' + action.object, 'object': action.object}]
        });
    }

    private setStates = (action: BlockObject, state: ObjectsPanelStateModel): any => {
        let newRow = {};
        let count = 0;
        let newState = [];
        let flag = 'new';

        for (const row of state.blockedObject) {
            count += 1;
            if (row.id === action.id) {
                if (row.object !== 'clear' && row.object !== action.object) { // Optional => to be fixed
                    newRow = {'id': action.id + '.'  + action.object, 'object': action.object};
                } else {
                    newRow = {
                        'id': action.id + '.' + action.object ,
                        'object': (row.object === 'clear') ? action.object : 'clear'
                    };
                    flag = 'update';
                }
                newState = newState.concat(newRow);
            } else {
                newState = newState.concat({'id': row.id + '.' + row.object, 'object': row.object});
                if (count === state.blockedObject.length && flag === 'new') {
                    newState = newState.concat({'id': action.id + '.' + action.object, 'object': action.object});
                }
            }
        }
        return newState;
    }
}
