import { HasElementsAndSyntacticName } from './HasElementsAndSyntacticName';

export class Token extends HasElementsAndSyntacticName {
  elements: string;

  flattenToTokens = (): Token[] => [this];
}