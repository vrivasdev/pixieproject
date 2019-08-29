import { Store } from '@ngxs/store';
import { Component } from '@angular/core';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';

@Component({
    selector: 'text-size-drawer',
    templateUrl: './text-size-drawer.component.html',
    styleUrls: ['./text-size-drawer.component.scss']
})
export class TextSizeDrawerComponent {
    public sizes: any = [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];

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
