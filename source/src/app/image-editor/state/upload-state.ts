import { Action, Selector, State, StateContext } from "@ngxs/store";
import { UploadProfile } from './upload-state-actions';

export interface UploadStateModel {
    uploadMLS?: boolean;
    uploadProfile?: boolean;
}

@State({
    name: 'uploadFiles',
    defaults: {
        uploadMLS: false,
        uploadProfile: false
    }
})
export class UploadState {
    @Action(UploadProfile)
    setUploadProfile(ctx: StateContext<UploadStateModel>, {uploadProfile}: UploadProfile ) {
        ctx.patchState({uploadProfile});
    }

    @Selector()
    static getUploadProfile(state: UploadStateModel) {
        return state.uploadProfile;
    }

    @Selector()
    static getUploadMls(state: UploadStateModel) {
        return state.uploadMLS;
    }
}
