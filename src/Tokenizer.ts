import { Token } from './TokenOrKeyword/Token';
import { TokenMatcher } from './TokenMatcher';


const whitespaceRegex = /^\s+/;
const carriageReturnRegex = /[\r\n]/g;



export class Tokenizer {

  constructor(public splitOnWhitespace: boolean = true) {

  }

  public replace = (regex: RegExp) => {
    return {
      with: (syntacticName: string) => {
        this.allKnownTokenMatchers.push(new TokenMatcher(regex, syntacticName));
      }
    };

  };

  allKnownTokenMatchers: TokenMatcher[] = [];

  public stripWhitespace = (text: string, currentStartingIndex: number): {
    cleanText: string,
    newStartingIndex: number,
    numberOfCarriageReturns: number
  } => {


    if (!this.splitOnWhitespace) {
      return {
        cleanText: text,
        newStartingIndex: currentStartingIndex,
        numberOfCarriageReturns: 0
      };
    }

    // Does our text start with whitespace?

    const whitespaceMatch = whitespaceRegex.exec(text);
    if (whitespaceMatch == null) {
      return {
        cleanText: text,
        newStartingIndex: currentStartingIndex,
        numberOfCarriageReturns: 0
      };
    }

    const whitespaceText = whitespaceMatch[0];

    let numberOfCarriageReturns: number = 0;
    let carriageReturnMatch = carriageReturnRegex.exec(whitespaceText);
    let carriageReturnIndex = -1;

    while (carriageReturnMatch != null) {
      numberOfCarriageReturns += carriageReturnMatch[0].length;
      carriageReturnIndex = carriageReturnMatch.index;
      carriageReturnMatch = carriageReturnRegex.exec(whitespaceText);
    }

    const cleanText = text.replace(whitespaceRegex, '');

    // If there's whitespace matched, we want to add those chars to our starting index.
    // Tabs, spaces -- they count.
    // But if a carriage return is among them, it resets the index back to 0,
    // so we only count the whitespace characters after the last carriage return.
    // The match looks wooly because length isn't zero-indexed and 
    // carriageReturn index is.

    return {
      cleanText,
      newStartingIndex: (whitespaceText.length - 1) - carriageReturnIndex,
      numberOfCarriageReturns
    };

  };

  public tokenizeSentence(sentence: string,
    startingIndex: number = 0,
    startingLine: number = 0)
    : Token[] {
    // Again, the design here is that we recurse.
    // It's straight out of The Little Schemer.
    // We return the match on the first character
    // at the front of our array,
    // and the rest of the array
    // is the match on the *rest* of the characters.

    // Recursion needs a base case.
    // Here, if we're done (the sentence is empty), don't recurse any more!
    if (sentence.length < 1) {
      return [];
    }

    let matchedToken: null | Token = null;
    let restOfSentence: string;

    let currentStartingIndex: number = startingIndex;
    let currentStartingLine: number = startingLine;



    for (const tokenMatcher of this.allKnownTokenMatchers) {

      let cleanSentence;

      if (this.stripWhitespace) {


        const {
          cleanText,
          newStartingIndex,
          numberOfCarriageReturns } =
          this.stripWhitespace(sentence, currentStartingIndex);

        currentStartingIndex = newStartingIndex;
        currentStartingLine += numberOfCarriageReturns;

        cleanSentence = cleanText;
      } else {
        cleanSentence = sentence;
      }

      const match: null | RegExpExecArray =
        tokenMatcher.regex.exec(cleanSentence);
      if (match != null) {
        matchedToken = new Token(
          tokenMatcher.syntacticName,
          match[0],
          currentStartingIndex + match.index,
          currentStartingLine
        );
        currentStartingIndex += match[0].length;
        restOfSentence = cleanSentence.substring(match[0].length);
        // Here it is: one array, with our (known) match up front
        // and our (unknown) future matches following.
        return [matchedToken, ...this.tokenizeSentence(restOfSentence,
          currentStartingIndex, currentStartingLine)];
      }
    }
    if (matchedToken == null) throw new Error(`Error tokenizing '${sentence[0]}' at column ${currentStartingIndex + 1} in line ${currentStartingLine + 1}`);
    return [];
  }
}