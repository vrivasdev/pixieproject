import { moveItemInArray } from '@angular/cdk/drag-drop';
import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Store } from '@ngxs/store';
import { CanvasStateService } from 'app/image-editor/canvas/canvas-state.service';
import { CanvasService } from 'app/image-editor/canvas/canvas.service';
import { ObjectsService } from 'app/image-editor/objects/objects.service';
import { UploadProfile } from 'app/image-editor/state/upload-state-actions';
import { Settings } from 'common/core/config/settings.service';

export interface DialogData {
    images: Array<string>
}

@Component({
    selector: 'dialog-images',
    templateUrl: 'dialog-images.html'
})
export class DialogImages {
    constructor(
        public dialogRef: MatDialogRef<DialogImages>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
        public canvas: CanvasService,
        public config: Settings,
        private objects: ObjectsService,
        private store: Store,
        private canvasState: CanvasStateService
        ) {}
    onNoClick(): void {
        this.dialogRef.close();
    }
    updateImage(selected) : void {
        const imgUrl = `${window.location.protocol}//${window.location.hostname}/img/mc-data/admin/${this.objects.getDir(this.config.get('pixie.profile.id'))}/${selected}`;
        const active: any = this.canvas.fabric().getActiveObject();
        const position = this.objects.getAll().findIndex(obj => obj.data.id === active.data.id);

        this.store.dispatch(new UploadProfile(true));
        
        this.canvas.updateProfileImage(active, imgUrl)
                   .then(objectId => {
                       // sync canvas' objects with panel
                       this.objects.syncObjects();
                       // reorder first label inserted
                       const allObj = this.objects.getAll();
                       
                       moveItemInArray(allObj, 0, position);
                       
                       this.objects.getById(allObj[position].data.id).moveTo(allObj.length - position -1);
                       this.canvasState.fabric.requestRenderAll();               
                   })
                   .catch(error => console.log('Update profile image error'));
    }
}