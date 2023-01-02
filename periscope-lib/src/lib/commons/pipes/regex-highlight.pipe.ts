import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { isArray, isNil } from 'lodash';

@Pipe({
  name: 'psRegexHighlight'
})
export class RegexHighlightPipe implements PipeTransform {
  constructor(private _domSanitizer: DomSanitizer) {}

  transform(value: string, patternOrPatterns: string | string[]): SafeHtml {
    if (isNil(value) || isNil(patternOrPatterns) || patternOrPatterns.length === 0) {
      return value;
    }

    const patterns = isArray(patternOrPatterns) ? <string[]>patternOrPatterns : <string[]>[patternOrPatterns];

    const html = patterns.reduce((accumulatedHtml, pattern) => {
        return this.replace(accumulatedHtml, pattern);
      }, value);

    return this._domSanitizer.bypassSecurityTrustHtml(html);
  }

  replace(value: string, pattern: string): string {
    const regexExpression = new RegExp(pattern, 'gi');

    return value.replace(
      regexExpression, (match) => `<span style="font-weight: 900;">${match}</span>`
    );
  }


}
