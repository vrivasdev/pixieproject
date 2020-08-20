import {Component, Inject} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

export interface DialogData {
    message: string,
    errorFound: boolean
}

@Component({
    selector: 'dialog-question',
    templateUrl: 'dialog-question.html'
})
export class DialogQuestion {
    message: string;
    result: string;

    constructor(
        public dialogRef: MatDialogRef<DialogQuestion>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}