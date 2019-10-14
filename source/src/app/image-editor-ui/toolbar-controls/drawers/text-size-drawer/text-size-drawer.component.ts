import { Store } from '@ngxs/store';
import { Component } from '@angular/core';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';

@Component({
    selector: 'text-size-drawer',
    templateUrl: './text-size-drawer.component.html',
    styleUrls: ['./text-size-drawer.component.scss']
})
export class TextSizeDrawerComponent {
    public size;
    constructor(
        private store: Store,
        public activeObject: ActiveObjectService
    ) {
      let obj: any = activeObject.get();
      this.size = 'fontSize' in obj ? obj.fontSize : 0;
    }

    public setTextSize(e: any) {
      this.activeObject.form.patchValue({
        fontSize: e.target.value
      });
    }
}
