import { ProductionFunction } from './types';
import { Trie } from './Trie';
import { TokenOrKeyword } from './TokenOrKeyword/HasElementsAndSyntacticName';


export const isProductionFunction = (
  possibleProduction: unknown
): possibleProduction is ProductionFunction => {
  return possibleProduction != null
  && !isTrie(possibleProduction as object) 
    && typeof possibleProduction === 'function';
  
};

export const isTrie = (maybeTrie: unknown): maybeTrie is Trie => {
  return maybeTrie != null
    && (maybeTrie as Trie).hashMap != null;
};

export const isTokenOrKeyword =
  (maybeTokenOrKeyword: unknown): maybeTokenOrKeyword is TokenOrKeyword => {
    return maybeTokenOrKeyword != null 
    && (maybeTokenOrKeyword as TokenOrKeyword).syntacticName != null;
  };
