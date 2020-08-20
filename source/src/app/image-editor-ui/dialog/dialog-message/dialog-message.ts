import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

export interface DialogData {
    message: string,
    errorFound: boolean
}

@Component({
    selector: 'dialog-message',
    templateUrl: 'dialog-message.html'
})
export class DialogMessage {
    message: string;
    errorFound: boolean;

    constructor(
        public dialogRef: MatDialogRef<DialogMessage>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}