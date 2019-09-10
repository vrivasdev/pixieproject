import { Action, State, StateContext, Store, Selector } from '@ngxs/store';
import { ObjectName } from './objects-panel.enum';
import { BlockObject } from './objects-panel.actions';

export interface ObjectsPanelStateModel {
    blockedObject: [{'id': string, 'objectId': string, 'state': ObjectName, 'max': number}];
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
        const json = {};
        state.blockedObject.forEach(obj => json[obj.id] = obj.state );
        return json;
    }
    @Selector()
    static maxTextObject(state: ObjectsPanelStateModel) {
        const json = {};
        state.blockedObject.forEach(obj => json[obj.id] = obj.max );
        return json;
    }

    constructor(private store: Store) {}

    @Action(BlockObject)
    BlockObject(ctx: StateContext<ObjectsPanelStateModel>, action: BlockObject) {
        ctx.patchState({
            blockedObject: ctx.getState().blockedObject.length ?
                           this.setStates(action, ctx.getState()) : [{'id': action.id, 'objectId': action.objectId,
                                                                      'state': action.state, 'max': action.max}]
        });
    }

    private setStates = (action: BlockObject, state: ObjectsPanelStateModel): any => {
        let newRow = {};
        let count = 0;
        let newState = [];
        let flag = 'new';

        for (const row of state.blockedObject) {
            count += 1;
            if (row.id === action.id) { // if actions are on same level
                if (row.state !== 'clear' && row.state !== action.state) {
                    if (count === state.blockedObject.length && flag === 'new') {
                        newRow = {'id': row.id, 'objectId': row.objectId, 'state': row.state, 'max': row.max};
                    } else {
                        newRow = {'id': action.id, 'objectId': row.objectId, 'state': action.state, 'max': action.max};
                    }
                } else {
                    newRow = {
                        'id': action.id,
                        'objectId': action.objectId,
                        'state': (row.state === 'clear') ? action.state : 'clear',
                        'max': action.max
                    };
                    flag = 'update';
                }
                newState = newState.concat(newRow);
            } else {
                newState = newState.concat({'id': row.id, 'objectId': row.objectId, 'state': row.state, 'max': row.max});
                if (count === state.blockedObject.length && flag === 'new') {
                    newState = newState.concat({'id': action.id, 'objectId': action.objectId, 'state': action.state, 'max': action.max});
                }
            }
        }
        return newState;
    }
}
