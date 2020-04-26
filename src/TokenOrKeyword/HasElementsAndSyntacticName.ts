import { Token } from './Token';
import { Keyword } from './Keyword';

export class HasElementsAndSyntacticName {
  constructor(
    public syntacticName: string,
    // By "elements", we mean "the elements we matched in the sentence we're tokenizing"
    public elements: string | Array<TokenOrKeyword>,
    public characterIndex: number = 0,
    public lineIndex : number = 0
  ) {
    if (typeof elements != 'string') {
      this.characterIndex = elements[0].characterIndex;
    }
  }

  getLength = (): number => {
    if (typeof this.elements === 'string') {
      // eslint-disable-next-line no-console
      console.log(
        `In a token, string is ${
          this.elements
        } with length ${
          this.elements.length}`
      );
      return this.elements.length;
    }
    return this.elements.reduce((acc, element) => {
      return acc + element.getLength();
    }, 0);
  };

  public toString = (): string => {
    return this.syntacticName;
  };

  flattenToString = (): string => this.elements.toString();

  flattenToTokens = (): Token[] => [];
}

export type TokenOrKeyword = HasElementsAndSyntacticName;

export const isToken = (maybeToken: TokenOrKeyword): maybeToken is Token => {
  return typeof maybeToken.elements === 'string';
};

export const isKeyword = (maybeKeyword: TokenOrKeyword):
  maybeKeyword is Keyword => {
  return Array.isArray(maybeKeyword.elements);
};