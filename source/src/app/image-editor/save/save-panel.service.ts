import {Injectable} from '@angular/core';
import { Settings } from 'common/core/config/settings.service';
import { Observable, from } from 'rxjs';

@Injectable()
export class SavePanelService {
    constructor(
        private config: Settings
    ){}

    public get(): Observable<any>{
        if (this.config.get('pixie.getCategories')) {
            return this.getCategory();
        }
    }

    public validateEmail(email: string): boolean {
        return /\S+@\S+\.\S+/.test(email);
    }

    public getCategory() {
        return from(fetch(
            this.config.get('pixie.getCategories'),
            {
                method: 'GET',
                headers: {
                'Content-Type': 'application/json',
                },
                mode: 'no-cors'
            })
            .then(resp => resp.json())
            .then(json => json.data)
        );
        /*return from(fetch('assets/response.json')
            .then(resp => resp.json())
            .then(json => json.data)
        );*/
    }
}