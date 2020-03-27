import {ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {Settings} from '../../../../common/core/config/settings.service';
import {ExportToolService} from '../../../image-editor/tools/export/export-tool.service';
import { SavePanelService } from 'app/image-editor/save/save-panel.service';
import { Observable } from 'rxjs';

interface SubCategory {
    id: string,
    name: string
}
  
interface Categories {
    name: string;
    subCategory: SubCategory[];
}

@Component({
    selector: 'save-panel',
    templateUrl: './save-panel.component.html',
    styleUrls: ['./save-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class SavePanelComponent {
    private id: number;
    private flyerName: string;
    private saveType: number;
    public active;
    public categories$: Observable<Categories[]>;

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
        private savePanel: SavePanelService
    ) {
        if (config.get('pixie.id')) {
            this.id = config.get('pixie.id')
            this.flyerName = config.get('pixie.flyerName')
            this.saveType = config.get('pixie.saveType')
        }
        this.categories$ = this.savePanel.get();
    }

    public save() {
        const val = this.saveForm.value;
        document.getElementById('gif-loader').style.display = 'flex';
        if (this.id) {
            this.exportTool.update(this.id, val.share, val.category, val.group,
                                   val.flyerName ? val.flyerName : this.flyerName,
                                   val.saveType ? val.saveType : this.saveType);
        } else {
            this.exportTool.save(val.share, val.category, val.group, val.flyerName, val.saveType);
        }
    }
}
