import { Injectable } from '@angular/core';
import { Setting } from 'common/core/config/settings.service';

@Injectable()
export class TextMappingService {
    constructor(
        private config: Setting
    ) {}

    public getVarContent(var:Array): any {
    }
}