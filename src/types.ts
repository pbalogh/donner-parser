import { TokenOrKeyword } from './TokenOrKeyword/HasElementsAndSyntacticName';

/* Types */

export type ProductionArg = string | ProductionFunction;

export type Term = string | TokenOrKeyword | MatchFunction;

export interface ProductionFunction {
  (matches: TokenOrKeyword[]): TokenOrKeyword[];
}

export interface MatchFunction {
  (term: Term): MatchFunctionResult;
  cleanup? : () => void;
}

export enum MatchFunctionResult {
  MATCH_FOUND,
  END_REACHED,
  FAILURE_CASE
}