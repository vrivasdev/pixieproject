import { Injectable } from '@angular/core';
import { Settings } from 'common/core/config/settings.service';

@Injectable()
export class TextMappingService {
    constructor(
        private config: Settings
    ) {}

    public getVarContent(text: string, vars: Array<string>): Promise<any> {
        return new Promise(resolve => {
            const profile = this.config.get('pixie.profile');
            const mlsVars = ['baths', 'street_number', 'street_name', 'apartment', 'zipcode',
                             'city', 'state', 'country', 'address', 'description', 'type', 'bedrooms', 'price'];
            let newText = text;

            vars.forEach(index => {
                if (profile[index]) {
                    if (mlsVars.includes(index) && profile['mls'].length > 0 ) {
                        /* TODO: if variable is mls */
                        
                    } else {
                        newText = newText.split(`[${index}]`).join(profile[index]);
                    }
                }
            });
            
            resolve(newText);
        });
    }

    public filterWords(text: string): Array<string> {
        return text.match(/\[(\w+)\]/g) ? text.match(/\[(\w+)\]/g) : [];
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
}
