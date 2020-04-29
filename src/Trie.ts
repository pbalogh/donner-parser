/* eslint-disable no-plusplus */
import { ProductionArg, ProductionFunction, Term, MatchFunctionResult, MatchFunction } from './types';
import { TokenOrKeyword, isToken } from './TokenOrKeyword/HasElementsAndSyntacticName';
import { isTrie, isProductionFunction, isTokenOrKeyword, isMatchFunction } from './typeGuards';
import { Keyword } from './TokenOrKeyword/Keyword';
import { Token } from './TokenOrKeyword/Token';

export class Trie {
  static termThatMayHaveCausedError: TokenOrKeyword;

  parse(terms: string | Array<Term>): TokenOrKeyword[] | null {
    console.log('PARSING');
    console.log('And this.hashMap is ', this.hashMap);
    console.log('and terms are ', terms);

    const termsToParse: Array<Term> = typeof terms === 'string' ? terms.split('') : terms;

    if (terms.length < 1) return [];

    let resultOfSinglePass: TokenOrKeyword[] | Term[] = termsToParse;

    let needToKeepParsing: boolean = true;

    let index = 0;

    do {
      const [results, foundSomething] = this.singlePass(resultOfSinglePass, this);
      resultOfSinglePass = results;
      needToKeepParsing = foundSomething;

      console.log(`resultOfSinglePass with index ${index} is `, resultOfSinglePass);
      index++;
    } while (needToKeepParsing && resultOfSinglePass.length > 1 && index < 5);

    if (resultOfSinglePass.length > 1) {
      if(Trie.termThatMayHaveCausedError) {
        console.log(`One of our matchFunctions told us the problem might be in ${ 
          Trie.termThatMayHaveCausedError}`);
        this.throwErrorForToken(Trie.termThatMayHaveCausedError);  
      } else {

        const problemItem: TokenOrKeyword = resultOfSinglePass[1] as TokenOrKeyword;
        console.log('resultOfSinglePass are ', resultOfSinglePass);
        this.throwErrorForToken(problemItem);  
      
      }
    }
    return resultOfSinglePass as TokenOrKeyword[];
  }

  throwErrorForToken = (problemItem:TokenOrKeyword) => {
    const str = problemItem.flattenToString();

    const firstToken : Token = isToken(problemItem) ? 
      problemItem : problemItem.flattenToTokens()[0];
        
    throw new Error(
      `Error parsing: ${str} at character ${firstToken.characterIndex + 1} of line ${firstToken.lineIndex + 1}`);
  
  };


  singlePass(terms: string | Array<Term>, currentTrie: Trie, termsWeMatchedToDrillDownHere: Term[] = []): [TokenOrKeyword[], boolean] {


    if (terms.length < 1) return [[], false];

    const trieOrFunctionWeFound = currentTrie.get(terms[0]);


    // If we found a way in, keep going.
    // That might get us results we can return.
    // Each time, we pop off the term we just matched.
    const ourPathHerePlusLatestTerm: TokenOrKeyword[] = [...termsWeMatchedToDrillDownHere, terms[0]] as TokenOrKeyword[];
    if (isTrie(trieOrFunctionWeFound)) {
      return this.singlePass(terms.slice(1), trieOrFunctionWeFound, ourPathHerePlusLatestTerm);
    }
    if (isProductionFunction(trieOrFunctionWeFound)) {
      // Put our success at the front of the thing we're returning.
      console.log('Bingo');
      const [nextResults] = this.singlePass(terms.slice(1), this);
      return [[
        ...trieOrFunctionWeFound(ourPathHerePlusLatestTerm),
        ...nextResults], true];
    }
    console.log("Couldn't return anything from ", terms);
    // Our leads didn't pan out for the first character.
    // So start again anew, with the *second* character.

    //
    // But first : what if this "first" character 
    // was in fact the last character in our sentence?
    // (It would be the first, too, if this function was being called
    // as part of a longer recursion.)
    //
    // If this is the last character, and we couldn't match it,
    // then we should just return it with failure.
    if (terms.length <= 1) return [terms as TokenOrKeyword[], false];
    // Here's the catch: were we looking at the top level of our trie?
    // or had we already started down a rabbithole?
    // Ex: (a+b) won't match OPENPARENS, ARG => ARGLIST but it will match WORD => ARG
    if (currentTrie === this) {
      // we were at the top level 
      // so the problem was that the first element in the sentence of terms
      // isn't a key on the top level of our trie.
      // No worries -- push it to the front, and keep going with the second one.


      const [nextResults, nextStepSucceeded] =
        this.singlePass(terms.slice(1), this);
      return [[terms[0] as Token,
        ...nextResults], nextStepSucceeded];
    }
    // We were down a rabbithole, and ended up at a dead end.
    // Let's try the same character again, but take it from the top.
    // Remember: we matched *something* to get down here.
    // So put that something on the front of our sentence
    // before we return it.
    const [nextResults, nextStepSucceeded] = this.singlePass(terms, this);
    return [[...termsWeMatchedToDrillDownHere as TokenOrKeyword[], ...nextResults], nextStepSucceeded];

  }

  set = (term: Term, value: Trie | ProductionFunction) => {
    const key = isTokenOrKeyword(term) ? term.syntacticName : term;
    this.hashMap.set(key, value);
  };

  get = (term: Term, ignoreFunction: boolean = false)
  : Trie | ProductionFunction | undefined => {
    const key = isTokenOrKeyword(term) ? term.syntacticName : term;
    console.log('You did a get on ', key);
    console.log('with ignoreFunction set to ', ignoreFunction);
    console.log('inside trie ', this);

    const retrievedValue = this.hashMap.get(key);

    // Best case scenario: we found something
    // (or ignoreFunction is true, as is the case when we're 
    // setting up our trie's definitions before parse-time)
    if (ignoreFunction || retrievedValue !== undefined) {
      console.log('Found something: ', retrievedValue);
      // We're not actually going to ignore the function completely.
      // If we were handed a function as the term,
      // we need to make sure it's added to the matchFunctions array
      // so that it can be used (if necessary) to match elements in a sentence.
      if(isMatchFunction( term)) {
        this.matchFunctions.push(term);
      }
      return retrievedValue;
    }

    console.log('Found nothing in hashMap, so will look at matchFunctions, which are ', 
      this.matchFunctions);
    // Normally, if the retrievedValue is undefined, we just return it.
    // But if the user has defined one or more matchFunctions,
    // we need to use those to see if we return:
    // - a new trie: that means we're ready to go on to the next term
    // (we were looking for something optional but didn't find it)
    // - the same trie: that means we're still looking for the same thing
    // (e.g., we were looking for vowels and found one)
    // - undefined: that means our match function needed something and found the *wrong* thing
    // (e.g., we needed a mandatory vowel but found a consonant)
    if (this.matchFunctions.length > 0) {
      return this.getValueFromMatchFunctions(term);
    }
    return retrievedValue;
  };

  getValueFromMatchFunctions = (term: Term):
  Trie | ProductionFunction | undefined => {
    
    // a matchFunction returns TRUE if the match is a success
    //
    // FALSE if the match should move on to the next trie,
    // applying the current term to it.
    //
    // and UNDEFINED if the match has failed completely (wrong term encountered)

    // Examples: A function call might have OPENPARENS, ARGLIST?, CLOSEPARENS.
    // If we hit an ARGLIST, we return true -- keep looking for more arglists
    // If we hit a CLOSEPARENS, we return false -- 

    // Examples: A function call might have OPENPARENS, ARGLIST?, CLOSEPARENS.
    // If we hit an ARGLIST, we return true -- keep looking for more arglists

    let functionThatReachedEnd: MatchFunction | null = null;
    

    for(const matchFunction of this.matchFunctions) {
      const result = matchFunction(term);

      // success always means we immediately leave in triumph
      if (result === MatchFunctionResult.MATCH_FOUND) {
        console.log("Found a match, so I'm staying here in this trie");
        return this;
      }
      if (result === MatchFunctionResult.END_REACHED) {
        console.log("Reached the end, so I'm leaving this trie");
        functionThatReachedEnd = matchFunction;
        if(matchFunction.cleanup != null) matchFunction.cleanup();
      } else if(matchFunction.cleanup != null) matchFunction.cleanup();
      // it failed, so reset it to its normal state
      // (in case it is a stateful function)
    }

    if (functionThatReachedEnd != null) {
      // Whatever the term is, it belongs in the *next* trie.
      // In other words, it's the key we'd use in the next trie -- like CLOSEPARENS,
      // from our above example.
      // Retrieve that trie, and find that next-trie-term in it.
      const trieOrProductionFunction = this.hashMap.get(functionThatReachedEnd)!;

      if (isTrie(trieOrProductionFunction)) {
        console.log('The kinda-failing function told me to move on to trie ', trieOrProductionFunction);
        return trieOrProductionFunction.get(term);
      }

      // This could be an edge case or bug:
      // what if our function says we're at the end,
      // but it was the last arg in our "replace()" construction command?

      return trieOrProductionFunction;
    }

    // This might have been an innocent mismatch,
    // and a subsequent pass over our sentence will make everything work out fine.
    // But just in case,
    // we want to plant a flag on this one. 
    Trie.termThatMayHaveCausedError = term as TokenOrKeyword;

    return undefined;
  };

  matchFunctions: MatchFunction[] = [];

  hashMap: Map<Term | MatchFunction, Trie | ProductionFunction> = new Map();

  replace = (...terms: Term[]) => {
    let currentTrie: Trie = this;
    let previousTrie: Trie = this;
    // We want the last term we encounter
    // to be remembered as 'key'
    // so that we can use it in our 'with' clause
    let key : Term;
    for (const term of terms) {
      // eslint-disable-next-line no-console
      key = term;
      console.log('In match, key is ', key);
      // We need to remember this trie
      // so that our with-method can use it.
      // If the last key in our matches was "y",
      // then right now we're assigning a Trie to it in currentTrie's hashmap,
      // but our with-method will want to assign a Function to it in currentTrie's hashmap.
      // Problem is, we're about to point currentTrie at a new Trie()!
      // so we'll keep a handle to it in previousTrie
      previousTrie = currentTrie;
      currentTrie = getOrMakeTrieIn(currentTrie, key);
    }
    return {
      with: (productionArg: ProductionArg): Trie => {
        previousTrie.set(key, makeOrGetFunction(productionArg));
        return this;
      }
    };
  };
}

const getOrMakeTrieIn = (oldTrie: Trie, key: Term): Trie => {

  if (oldTrie.get(key, true) == null) {
    console.log("Couldn't find anything, so making a new trie");
    const newTrie = new Trie();
    oldTrie.set(key, newTrie);
    return newTrie;
  }

  const returnTrie = oldTrie.get(key, true);
  if (isTrie(returnTrie)) return returnTrie;
  throw new Error("You're already at the end");
};

const makeOrGetFunction =
  (productionArg: ProductionArg): ProductionFunction => {

    if (isProductionFunction(productionArg)) {
      return productionArg;
    }

    // We were given a string
    const newFunc: ProductionFunction = (matches: TokenOrKeyword[]) => {
      console.log('Inside Function, matches are ', matches);
      const newKeyword = new Keyword(productionArg, matches);
      console.log('newKeyword is ', newKeyword);
      return [newKeyword];
    };
    return newFunc;
  };
