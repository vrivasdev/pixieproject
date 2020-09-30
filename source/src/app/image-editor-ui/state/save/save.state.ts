import { Store, Action, StateContext, Selector, State } from "@ngxs/store";
import { Save } from "./save.actions";
import { Type } from "./save.enum";

export interface SaveStateModel {
    type: Type
}

@State({
    name: 'SaveState',
    defaults: {
        type: []
    }
})
export class SaveState {
    constructor(private store: Store) {}

    @Selector()
    static getType(state: SaveStateModel) {
        return state.type;
    }

    @Action(Save)
    Save (ctx: StateContext<SaveStateModel>, action: Save ) {
        ctx.patchState({
            type: action.type
        });
    }
}