import { Injectable } from '@angular/core';
import { Settings } from 'common/core/config/settings.service';
import { ActiveObjectService } from 'app/image-editor/canvas/active-object/active-object.service';
import { CanvasService } from 'app/image-editor/canvas/canvas.service';
import { Store } from '@ngxs/store';
import { MappingState } from 'app/image-editor/state/mapping-state';

@Injectable()
export class TextMappingService {
    private 
    constructor(
        private config: Settings,
        private store: Store
    ) {}

    public getVarContent(text: string, vars: Array<string>): Promise<any> {
        return new Promise(resolve => {
            const profile = this.config.get('pixie.profile');

            const mlsVars = ['baths', 'street_number', 'street_name', 'apartment', 'zipcode',
                             'city', 'state', 'country', 'address', 'description', 'type', 'bedrooms', 'price'];
            let variables;
            let row;
            let newText = text;
            let hasUpperCase = false;

            vars.forEach(index => {
                if (this.hasUppercase(index)) {
                    index = index.slice(1,-1);
                    hasUpperCase = true;
                    newText = newText.replace('(','')
                                     .replace(')','');
                } else {
                    hasUpperCase = false;
                }
                if (mlsVars.includes(index) && profile['mls'].length > 0 ) {// MLS: only the first mls
                    variables = this.mapVariables(profile['mls']); // one or more mls
                    row = variables[0][index];
                } else { // Profile: get row
                    row = profile[index];
                }
                // if text has parenthesis convert it into uppercase
                newText = newText.split(`[${index}]`).join(hasUpperCase? row.toUpperCase() : row);
            });
            resolve(newText);
        });
    }

    private mapVariables(data: Array<any> = []): Array<any> {
        const merged = [];
        data.forEach(row => merged.push({...row[0], ...row[1]}));
        return merged;
    }

    private hasUppercase(text: string): boolean {
        return  /^(\()(\w+)(\))$/g.test(text);
    }

    public filterWords(text: string): Array<string> {
        const pattern = /\[(\()?(\w+)(\))?\]/g;
        return text.match(pattern) ? text.match(pattern) : [];
    }

    public toggleText(obj: any, text: string, newText: string): void {
        if ('tmpText' in obj && obj.tmpText) {
            obj.set('text', obj.tmpText);
            delete  obj.tmpText;
        } else {
            obj.set('tmpText', text);
            obj.set('text', newText);
        }
    }

    public mapProfileVariables(textObjects: any): any {
        return new Promise(resolve => {
            const newObjects = [];
            textObjects.forEach(object => {
                if (object.type === 'i-text') {
                    let oldText = object.text;
                    if (oldText) {
                        this.getVarContent(oldText,
                                           this.filterWords(oldText)
                                               .map(value => value.slice(1, -1)))
                                               .then(text => newObjects.push({...object, text}));
                    }
                }
                else if(object.type === 'image'){
                    const objects = this.store.selectSnapshot(MappingState.getMappingObjects);
                    const found: any = objects.filter(obj => obj.type === 'profile' && 
                                                             obj.objectId === object.data.id);
                    const base = `${window.location.protocol}//${window.location.hostname}`;
                    const img = this.config.get('pixie.profile.Image');

                    if (found.length && img) {
                        newObjects.push({...object, 
                                         src: `${base}/${img}`});
                    } else {
                        newObjects.push({...object});
                    }
                }
                else {
                    newObjects.push({...object});
                }
            });
            console.log('____ objects ____');
            console.log(newObjects);
            resolve(newObjects);
        });   
    }

    public getImageOrFallback(path, fallback) {
        return new Promise(resolve => {
            const img = new Image();
            img.src = path;
            img.onload = () => resolve(path);
            img.onerror = () => resolve(fallback);
        });
    };
}
