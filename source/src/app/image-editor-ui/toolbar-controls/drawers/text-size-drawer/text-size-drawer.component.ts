import { Store } from '@ngxs/store';
import { Component } from '@angular/core';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';
import { MatSelectChange } from '@angular/material';

@Component({
    selector: 'text-size-drawer',
    templateUrl: './text-size-drawer.component.html',
    styleUrls: ['./text-size-drawer.component.scss']
})
export class TextSizeDrawerComponent {
    public sizes: any = [20, 22, 24, 30, 40];

    constructor(
        private store: Store,
        public activeObject: ActiveObjectService
    ) {}

    public setTextSize(e: any) {
      this.activeObject.form.patchValue({
        fontSize: e.target.value
      });
    }
}
