import { Tokenizer } from '../Tokenizer';

// const identifierRegex = /^[$_\p{L}][-$_\p{L}\p{N}]*/u;
// const quotedStringRegex = /"([^"\\]*(\\.[^"\\]*)*)"|\'([^\'\\]*(\\.[^\'\\]*)*)\'/;


describe('replace-method and with-method', () => {
  let tokenizer : Tokenizer;
  beforeEach(() => {
    tokenizer = new Tokenizer();
  });
  it('should create tokenMatchers', () => {
    expect(tokenizer.replace(/^[a-zA-Z]+/).with('WORD')).not.toBeNull();
    tokenizer.replace(/^\d+/).with('NUMBER');
    expect(tokenizer.allKnownTokenMatchers.length).toBe(2);
    const tokens = tokenizer.tokenizeSentence('AbC1234');
    expect(tokens.length).toBe(2);
    expect(tokens[0].syntacticName).toBe('WORD');
    expect(tokens[0].elements).toBe('AbC');
    expect(tokens[0].characterIndex).toBe(0);
    expect(tokens[0].getLength()).toBe(3);
    expect(tokens[1].syntacticName).toBe('NUMBER');
    expect(tokens[1].elements).toBe('1234');
    expect(tokens[1].characterIndex).toBe(3);
    expect(tokens[1].getLength()).toBe(4);
  });

  it('should use stripWhitespace accurately', () => {
  
    const text = `  
foo`;
    const { cleanText, newStartingIndex, numberOfCarriageReturns } = 
    tokenizer.stripWhitespace(text, 2);
    expect(cleanText).toBe('foo');
    expect(newStartingIndex).toBe(0);
    expect(numberOfCarriageReturns).toBe(1);

    const text2 = `  

    foo`;

    const { cleanText: cleanText2, 
      newStartingIndex: newStartingIndex2, 
      numberOfCarriageReturns: numberOfCarriageReturns2 } = 
    tokenizer.stripWhitespace(text2, 2);
    expect(cleanText2).toBe('foo');
    expect(newStartingIndex2).toBe(4);
    expect(numberOfCarriageReturns2).toBe(2);
  });

  it('should give accurate indices of where tokens are in text', () => {
    const text = `  

    foo
bar`;

    tokenizer.replace(/^[a-zA-Z]+/).with('WORD');
    const tokens = tokenizer.tokenizeSentence(text);
    expect(tokens.length).toBe(2);
    expect(tokens[0].characterIndex).toBe(4);
    expect(tokens[0].lineIndex).toBe(2);
    expect(tokens[1].characterIndex).toBe(0);
    expect(tokens[1].lineIndex).toBe(3);

  });

  it('should throw errors if it encounters characters it cannot tokenize', () => {
    expect(tokenizer.replace(/^[a-zA-Z]+/).with('WORD')).not.toBeNull();
    try {
      tokenizer.tokenizeSentence('AbC1234');
    } catch (e) {
      expect(e.message).toBe("Error tokenizing '1' at column 4 in line 1");
    }
  });
});