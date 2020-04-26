import { HasElementsAndSyntacticName, TokenOrKeyword } from './HasElementsAndSyntacticName';
import { Token } from './Token';


export class Keyword extends HasElementsAndSyntacticName {
  elements: TokenOrKeyword[];

  flattenToString = (): string =>
    this.elements.reduce((acc: string, elem: TokenOrKeyword) => {
      return acc + elem.flattenToString();
    }, '');

  flattenToTokens = (): Token[] =>
    this.elements.reduce((acc: Token[], elem) => {
      return acc.concat(elem.flattenToTokens());
    }, []);
}


