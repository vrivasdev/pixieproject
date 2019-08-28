import { Store } from '@ngxs/store';
import { Component } from '@angular/core';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';

@Component({
    selector: 'text-size',
    templateUrl: './text-size-drawer.component.html',
    styleUrls: ['./text-size-drawer.component.scss']
})
export class TextSizeDrawerComponent {
    constructor(
        private store: Store,
        public activeObject: ActiveObjectService
    ) {}
}
