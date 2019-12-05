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
            let newText = text;

            vars.forEach(index => {
                if (profile[index]) newText = newText.split(index).join(profile[index]);
            });
            
            resolve(newText);
        });
    }

    public filterWords(text: string): Array<string> {
        return text.match(/\[(\w+)\]/g) ? text.match(/\[(\w+)\]/g) : [];
    }
}
