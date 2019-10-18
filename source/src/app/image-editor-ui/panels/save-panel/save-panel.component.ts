import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Settings} from '../../../../common/core/config/settings.service';
import {ExportToolService} from '../../../image-editor/tools/export/export-tool.service';
import {BehaviorSubject} from 'rxjs';

@Component({
    selector: 'save-panel',
    templateUrl: './save-panel.component.html',
    styleUrls: ['./save-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class SavePanelComponent implements OnInit {
    private id;
    private data;
    public saveForm = new FormGroup({
        share: new FormControl(),
        category: new FormControl(),
        group: new FormControl(),
        flyerName: new FormControl(),
        saveType: new FormControl(),
    });

    constructor(
        private config: Settings,
        private exportTool: ExportToolService,
    ) {
        this.id = config.get('pixie.id');
    }

    ngOnInit() {
        if (this.id) { // if edit action is active
            this.data = this.exportTool.get(this.id);
        }
    }

    public save() {
        const val = this.saveForm.value;

        if (this.id) {
            this.exportTool.update(this.id, val.share, val.category, val.group, val.flyerName, val.saveType);
        } else {
            this.exportTool.save(val.share, val.category, val.group, val.flyerName, val.saveType);
        }
    }
}
