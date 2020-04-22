import {ChangeDetectionStrategy, Component, ViewEncapsulation, ViewChild, ElementRef} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Settings} from '../../../../common/core/config/settings.service';
import {ExportToolService} from '../../../image-editor/tools/export/export-tool.service';
import { SavePanelService } from 'app/image-editor/save/save-panel.service';
import { Observable } from 'rxjs';
import { COMMA, ENTER, SPACE, TAB } from '@angular/cdk/keycodes';
import { startWith, map } from 'rxjs/operators';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent, MatAutocomplete} from '@angular/material/autocomplete';

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
    public visible = true;
    public selectable = true;
    public removable = true;
    public separatorKeysCodes: number[] = [ENTER, COMMA, SPACE, TAB];
    public agentCtrl = new FormControl();
    public filteredAgents: Observable<string[]>;
    public agents: string[] = [];                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
    public allAgents: string[] = ['everyone', 'rrondon@avantiway.com'];

    public saveForm = new FormGroup({
        category: new FormControl(),
        group: new FormControl(),
        flyerName: new FormControl(),
        saveType: new FormControl(),
        agentCtrl: new FormControl()
    });

    @ViewChild('agentInput') agentInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto') matAutocomplete: MatAutocomplete;
    
    constructor(
        private config: Settings,
        private exportTool: ExportToolService,
        private savePanel: SavePanelService
    ) {
        if (config.get('pixie.id')) {
            this.id = config.get('pixie.id');
            this.flyerName = config.get('pixie.flyerName');
            this.saveType = config.get('pixie.saveType');
        }
        
        this.categories$ = this.savePanel.get();

        this.filteredAgents = this.agentCtrl.valueChanges.pipe(
            startWith(null),
            map((fruit: string | null) => fruit ? this._filter(fruit) : this.allAgents.slice()));
    }

    public save() {
        const val = this.saveForm.value;

        if (this.id) {
            this.exportTool.update(this.id, 
                                   this.agents,
                                   val.category, 
                                   val.group,
                                   val.flyerName ? val.flyerName : this.flyerName,
                                   val.saveType ? val.saveType : this.saveType);
        } else {
            this.exportTool.save(this.agents, 
                                 val.category, 
                                 val.group, 
                                 val.flyerName, 
                                 val.saveType);
        }

        document.getElementById('gif-loader')
                .style
                .display = 'flex';
    }

    public add(event: MatChipInputEvent): void {
        const input = event.input;
        const value = event.value;
    
        // Add Agent
        if ((value || '').trim()) {
          this.agents.push(value.trim());
        }
    
        // Reset the input value
        if (input) {
          input.value = '';
        }
    
        this.agentCtrl.setValue(null);
      }
    
    public remove(fruit: string): void {
        const index = this.agents.indexOf(fruit);

        if (index >= 0) {
            this.agents.splice(index, 1);
        }
    }
    
    public selected(event: MatAutocompleteSelectedEvent): void {
        this.agents.push(event.option.viewValue);
        this.agentInput.nativeElement.value = '';
        this.agentCtrl.setValue(null);
    }

    private _filter(value: string): string[] {
        return this.allAgents
                    .filter(fruit => fruit.toLowerCase()
                                          .indexOf(value.toLowerCase()) === 0);
    }
}
