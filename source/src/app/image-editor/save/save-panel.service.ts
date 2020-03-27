import {Injectable} from '@angular/core';
import { Object } from 'fabric/fabric-impl';
import { Settings } from 'common/core/config/settings.service';
import * as categoriesResponse from 'assets/response.json';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable()
export class SavePanelService {
    constructor(
        private config: Settings
    ){}

    public get(): Observable<any[]>{
        if (this.config.get('pixie.getCategories')) {
            /*fetch(
                this.config.get('pixie.getCategories'),
                {
                    method: 'GET',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                    mode: 'no-cors'
                })
                .then(resp => resp.json())
                .then(json => console.log(json))
                .catch(error => console.log('Error:', error));*/
            return of(categoriesResponse.data).pipe(delay(500));
        }
    }
}