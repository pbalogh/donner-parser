import { TokenOrKeyword } from './TokenOrKeyword/HasElementsAndSyntacticName';

/* Types */

export type ProductionArg = string | ProductionFunction;

export type Term = string | TokenOrKeyword;

export interface ProductionFunction {
  (matches: TokenOrKeyword[]): TokenOrKeyword[];
}

export interface MatchFunction {
  (term: Term): MatchFunctionResult;
}

export enum MatchFunctionResult {
  MATCH_FOUND,
  END_REACHED,
  FAILURE_CASE
}