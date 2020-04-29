import { Trie } from '../Trie';
import { isProductionFunction, isTrie } from '../typeGuards';
import { HasElementsAndSyntacticName, TokenOrKeyword } from '../TokenOrKeyword/HasElementsAndSyntacticName';
import { Token } from '../TokenOrKeyword/Token';
import { Tokenizer } from '../Tokenizer';
import { Keyword } from '../TokenOrKeyword/Keyword';
import { MatchFunctionResult } from '../types';

describe('replace-method and with-method', () => {
  let trie: Trie;
  beforeEach(() => {
    trie = new Trie();
  });
  it('should take array of string', () => {
    expect(trie.replace('a', 'b').with).not.toBeNull();
  });
  it('should do replace-with on array of strings', () => {
    const fullTrie: Trie = trie.replace('a', 'b').with('c');
    expect(isTrie(fullTrie)).toBe(true);
    expect(isTrie(fullTrie.get('a'))).toBe(true);
    expect(isProductionFunction(fullTrie.get('a'))).toBe(false);
    const thing = fullTrie.get('a') as Trie;
    const thing2 = thing.get('b');
    expect(isProductionFunction(thing2)).toBe(true);
  });

  it('should do multiple passes of replace-with on array of strings', () => {
    trie.replace('a', 'b').with('c').replace('a', 'd').with('e');
    expect(isTrie(trie)).toBe(true);
    expect(isTrie(trie.get('a'))).toBe(true);
    expect(isProductionFunction(trie.get('a'))).toBe(false);
    const thing = trie.get('a') as Trie;
    const thing2 = thing.get('b');
    expect(isProductionFunction(thing2)).toBe(true);
    const thing3 = thing.get('d');
    expect(isProductionFunction(thing3)).toBe(true);
  });

  it('should do replace-with on array of TokenOrKeywords', () => {
    const fullTrie: Trie = trie.replace('a', 'b').with('c');
    expect(isTrie(fullTrie)).toBe(true);
    expect(isTrie(fullTrie.get('a'))).toBe(true);
    expect(isProductionFunction(fullTrie.get('a'))).toBe(false);
    const thing = fullTrie.get('a') as Trie;
    const thing2 = thing.get('b');
    expect(isProductionFunction(thing2)).toBe(true);
  });

  it('should retrieve a Trie by key from Trie', () => {
    const fullTrie: Trie = trie.replace('a', 'b').with('c');
    const thing = fullTrie.get('a');
    expect(isTrie(thing)).toBe(true);
  });

  it('should handle retrieving a missing key from Trie', () => {
    const fullTrie: Trie = trie.replace('a', 'b').with('c');
    const thing = fullTrie.get('g');
    expect(isTrie(thing)).toBe(false);
    expect(thing == null).toBe(true);
  });

  it('should retrieve a ProductionFunction by key from Trie', () => {
    const fullTrie: Trie = trie.replace('a', 'b').with('c');
    const thing = fullTrie.get('a') as Trie;
    expect(isTrie(thing)).toBe(true);
    const thing2 = thing.get('b');
    expect(isProductionFunction(thing2)).toBe(true);
  });

  it('should allow arrays of tokens to be passed as elements and used as keys', () => {
    const ob1 = new Token('ob1', 'ob1');
    const ob2 = new HasElementsAndSyntacticName('ob2', 'ob2');
    const fullTrie: Trie = trie.replace(ob1, ob2).with('c');
    const thing = fullTrie.get(ob1) as Trie;
    expect(thing != null).toBe(true);
    const thing2 = thing.get(ob2);
    expect(isProductionFunction(thing2)).toBe(true);
  });

  it('should allow arrays of tokens to be passed as elements and used on string sentences', () => {
    const ob1 = new Token('ob1', 'ob1');
    const ob2 = new HasElementsAndSyntacticName('ob2', 'ob2');
    const fullTrie: Trie = trie.replace('ob1', 'ob2').with('c');
    const thing = fullTrie.get(ob1) as Trie;
    expect(thing != null).toBe(true);
    const thing2 = thing.get(ob2);
    expect(isProductionFunction(thing2)).toBe(true);
  });

  it('should parse an array of strings after doing multiple passes of replace-with on array of strings', () => {
    trie.replace('a', 'b').with('c')
      .replace('a', 'd').with('e');
    const result: null | TokenOrKeyword[] = trie.parse(['a', 'd']);
    expect(result).not.toBeNull();
    if (result != null) {
      expect(result[0].syntacticName).toBe('e');
    } else {
      throw new Error('Should not have been null');
    }

  });

  it('should parse an array of tokens over multiple passes', () => {

    const tokenizer = new Tokenizer();
    tokenizer.replace(/^[a-zA-Z]+/).with('WORD');
    tokenizer.replace(/^\d+/).with('NUMBER');

    const tokenSentence = tokenizer.tokenizeSentence('abc123def456');

    trie.replace('WORD', 'NUMBER').with('WORDANDNUMBERPAIR')
      .replace('WORDANDNUMBERPAIR', 'WORDANDNUMBERPAIR').with('TWOPAIRS');
    const result: null | TokenOrKeyword[] = trie.parse(tokenSentence);
    console.log('In test, result is ', result);
    if (result != null) {
      expect(result.length).toBe(1);
      expect(result[0].syntacticName).toBe('TWOPAIRS');
    } else {
      throw new Error('Should not have been null');
    }
  });

  it('should stop when parsing stops being productive', () => {

    const tokenizer = new Tokenizer();
    tokenizer.replace(/^[a-zA-Z]+/).with('WORD');
    tokenizer.replace(/^\d+/).with('NUMBER');

    const tokenSentence = tokenizer.tokenizeSentence('abc123def456');

    trie.replace('WORD', 'NUMBER').with('WORDANDNUMBERPAIR');
    try {
      trie.parse(tokenSentence);
    } catch (e) {
      expect(e.message).toBe('Error parsing: def456 at character 6');
    }
  });

  it('should work with production functions', () => {

    const tokenizer = new Tokenizer();
    tokenizer.replace(/^[a-zA-Z]+/).with('WORD');
    tokenizer.replace(/^\d+/).with('NUMBER');

    const tokenSentence = tokenizer.tokenizeSentence('abc123def456');

    trie.replace('WORD', 'NUMBER').with(
      ((matches:TokenOrKeyword[]) => [new Keyword('WORDANDNUMBERPAIR', matches)]))
      .replace('WORDANDNUMBERPAIR', 'WORDANDNUMBERPAIR').with('TWOPAIRS');
    const result: null | TokenOrKeyword[] = trie.parse(tokenSentence);
    console.log('In test, result is ', result);
    if (result != null) {
      expect(result.length).toBe(1);
      expect(result[0].syntacticName).toBe('TWOPAIRS');
    } else {
      throw new Error('Should not have been null');
    }
  });

  it('should handle repetition by recursion', () => {

    const tokenizer = new Tokenizer();
    tokenizer.replace(/^[a-zA-Z]+/).with('WORD');
    tokenizer.replace(/^\d+/).with('NUMBER');
    tokenizer.replace(/^\(/).with('OPENPARENS');
    tokenizer.replace(/^\)/).with('CLOSEPARENS');
    tokenizer.replace(/^,/).with('COMMA');

    const tokenSentence = tokenizer.tokenizeSentence('(a,b)');

    trie
      .replace('WORD').with('ARG')
      .replace('NUMBER').with('ARG')
      .replace('OPENPARENS', 'ARG').with('ARGLIST')
      .replace('ARGLIST', 'COMMA', 'ARG').with('ARGLIST')
      .replace('ARGLIST', 'CLOSEPARENS').with('ARGLISTCOMPLETE');
    const result: null | TokenOrKeyword[] = trie.parse(tokenSentence);
    console.log('In test, result is ', result);
    if (result != null) {
      expect(result.length).toBe(1);
      expect(result[0].syntacticName).toBe('ARGLISTCOMPLETE');
    } else {
      throw new Error('Should not have been null');
    }
  });

  describe('match functions', () => {

  
    it('should succeed under the right circumstances and should have cleanup ability', () => {

      const tokenizer = new Tokenizer();
      tokenizer.replace(/^[a-zA-Z]+/).with('WORD');
      tokenizer.replace(/^\(/).with('OPENPARENS');
      tokenizer.replace(/^\)/).with('CLOSEPARENS');
      tokenizer.replace(/^,/).with('COMMA');

      const tokenSentence = tokenizer.tokenizeSentence('(a,b)');

      let justSawWord = false;
      let justSawComma = false;

      const matchFunction = (tokenOrKeyword: TokenOrKeyword) => {
        const { syntacticName } = tokenOrKeyword;
        console.log('Inside my matchFunction, looking at syntacticName ', syntacticName);
        console.log(`while justSawWord is ${  justSawWord  } and justSawComma is ${
          justSawComma}`);
        if(syntacticName === 'WORD') {
          if(justSawWord) return MatchFunctionResult.FAILURE_CASE; 
          justSawWord = true;
          justSawComma = false;
          console.log('matched!');
          return MatchFunctionResult.MATCH_FOUND;
        }
        if(syntacticName === 'COMMA') {
          if(justSawComma) return MatchFunctionResult.FAILURE_CASE; 
          justSawComma = true;
          justSawWord = false;
          console.log('matched!');
          return MatchFunctionResult.MATCH_FOUND;
        }
        console.log('end of match function');
        
        return MatchFunctionResult.END_REACHED;
      };

      // Adding cleanup - an optional function
      // that allows us to reset our state 
      // so that it is ready for the next time we call this function
      matchFunction.cleanup = jest.fn();

      trie
        .replace('OPENPARENS', matchFunction, 'CLOSEPARENS').with('COMPLETE_ARGLIST');
      const result: null | TokenOrKeyword[] = trie.parse(tokenSentence);
      // eslint-disable-next-line no-console
      console.log('In test, result is ', result);
      if (result != null) {
        expect(result.length).toBe(1);
        expect(result[0].syntacticName).toBe('COMPLETE_ARGLIST');
        expect(matchFunction.cleanup).toHaveBeenCalled();
      } else {
        throw new Error('Should not have been null');
      }
    });

    it('should let match functions throw errors', () => {

      const tokenizer = new Tokenizer();
      tokenizer.replace(/^[a-zA-Z]+/).with('WORD');
      tokenizer.replace(/^\(/).with('OPENPARENS');
      tokenizer.replace(/^\)/).with('CLOSEPARENS');
      tokenizer.replace(/^,/).with('COMMA');

      const tokenSentence = tokenizer.tokenizeSentence('(a,,)');

      let justSawWord = false;
      let justSawComma = false;

      const matchFunction = (tokenOrKeyword: TokenOrKeyword) => {
        const { syntacticName } = tokenOrKeyword;
        console.log('Inside my matchFunction, looking at syntacticName ', syntacticName);
        console.log(`while justSawWord is ${  justSawWord  } and justSawComma is ${
          justSawComma}`);
        if(syntacticName === 'WORD') {
          if(justSawWord) return MatchFunctionResult.FAILURE_CASE; 
          justSawWord = true;
          justSawComma = false;
          console.log('matched!');
          return MatchFunctionResult.MATCH_FOUND;
        }
        if(syntacticName === 'COMMA') {
          if(justSawComma) return MatchFunctionResult.FAILURE_CASE; 
          justSawComma = true;
          justSawWord = false;
          console.log('matched!');
          return MatchFunctionResult.MATCH_FOUND;
        }
        console.log('end of match function');
        return MatchFunctionResult.END_REACHED;
      };
      matchFunction.cleanup = () => {
        justSawWord = false;
        justSawComma = false;
      };

      trie
        .replace('OPENPARENS', matchFunction, 'CLOSEPARENS').with('COMPLETE_ARGLIST');

      try {
        trie.parse(tokenSentence);
      } catch(e) {
        expect(e.message).toBe('Error parsing: , at character 4 of line 1');
      }
    });
  });
});

