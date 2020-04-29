# donner-parser

TODO: Try a demo with XML parsing
  
TODO: Helpful error messages based on what kind of Keyword we're left with.
Is this keyword in our trie? If so, where? Does it need to be followed by something?
(We can look in our result sentence to see if it is -- and then chase _that_ down)
Or does it need to be _following_ something?

This is a LRParser that breaks down your syntax productions rules into a trie-like structure.

## Quick Background
A trie is a very very fast string searching tool.
It's basically a lookup table for each letter 
in every word in your vocabulary
(that is, each letter *in the order it appears in*, as we'll see in a moment).
So if someone hands you a word and asks if it's in your vocabulary,
you simply step through that word letter by letter,
and if you keep finding results in your lookup table, 
you know this unknown word already exists in your vocabulary.
### Creating the Trie
If your vocabulary contains only the words
"or" and "of", you would step through them letter by letter
and create an entry in your hashmap
(starting at the top for the first level, and drilling inward with each step forward)
to show that this letter exists.

You create a root hashmap. Initially, it's empty.
Then start looping through each word.
For each word, start with a variable like "currentHashmap" 
pointing to your root hashmap.
Now loop through your current word, letter by letter.
E.g., the first letter of "or" is "o", so you'd create an entry
in your currentHashmap for the letter "o",
changing it from {} to
{
    "o": {}
},
and you would change your currentHashmap to point to root["o"]
(the empty object you just created).
The second letter of "or" is "r", so you'd create an entry in currentHashmap for "r".
currentHashmap would now be
{ "r": "or" }
(Since "r" is the last letter in our word, we don't create a new hashmap in there,
but just set it to be the string "or".)
Which means root hashmap would now be
{
    "o":
    {
        "r" : "or"
    }
}.

Repeat for the word "of".
Set your currentHashmap to point to the root hashmap.
Your first letter is "o".
The root hashmap already has a key for "o", so you don't need to create anything;
just set currentHashmap to point to root["o"].
Your second letter is "f".
The currentHashmap doesn't have an entry for it, so you create one for "f"
and, since you're at the end of your word, set it to be the string "of".
Which means root hashmap would now be
{ 
    "o": 
    { 
        "r" : "or", 
        "f": "of" 
    }
}.

This is a simplified view of the trie structure, of course.
There is a world of innovations, implementations, and variations worth exploring.
(One obvious shortcoming of this simplified implementation is that it doesn't work
with any two words that share the same beginning letters!
It wouldn't be able to index both "of" and "off", for example.)

At any rate, think of a syntactic production rule as a series of "letters" 
that form a "word".

Here's a simple BNF grammar for how some productions might be defined:

<expression> ::= <expression> <binaryoperator> <expression>
<binaryoperator> ::= <plus_sign> | <minus_sign>
<expression> ::= <number>

If we went all the way with this , we might do something like

<number> ::= <number> <digit>
<number> ::= <digit>
<digit> ::= 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
<plus_sign> ::= +
<minus_sign> ::= -

...but in practice we can easily define a tokenizer with regular expressions
to parse digit sequences into a 'NUMBER' token. 
It can also transform "+" and "-" characters into 'PLUS_SIGN' and 'MINUS_SIGN' tokens.

### A Quick Aside on Tokens
For the sake of this parser, a Token is a wrapper around raw text.
A Token always has a syntacticName, 
so we know what *kind* of thing that raw text was.
That way we won't get thrown by things like case-sensitivity or variants or whatnot.
(Our regular expression can catch all of that and lump things together.)

A Token also has some useful properties:
it can store the line number and column number where its text appears.
That way, if you need to throw error messages,
and you know this token is where the trouble occurred,
you can tell the user exactly where the problem can be found.

### End of Aside on Tokens

For our left-right parser, we would flip these rules
so we could start with the end product 
(the sentence that was produced according to these rules)
and, looking at each sequence of words in this sentence, 
figure out which keyword-rule created that sequence.
Then we'd replace those words with that rule's keyword.
And we would recurse until we arrived at the top of the tree (hopefully).

For example, if we found a number, we'd replace it with <expression>.
If we found +, we'd replace it with <binaryoperator>.

Thus, the sentence 7 + 3 would be changed into <expression> <binaryoperator> <expression>.

Well, that's three Keywords long,
and the goal of a parser is to wrap everything into a single Keyword
that contains the entire syntax tree.

So as long as our new sentence is more than one keyword long,
we start again by recursing over it
and seeing if any of our rules apply to this *new* sentence.

In our second pass over our (changed) sentence, we'd replace 
<expression> <binaryoperator> <expression> with <expression>.

Our new sentence would be only one Keyword: <expression>.
Success!

### Why Are Keywords Good?
The same way Tokens embody additional information about text,
like line number and column number,
a Keyword has an .elements property
that contains all the things that were matched and which it replaced.
So the final <expression> Keyword in our sentence above,
the one thing we're left with,
has an array of Keywords in its .elements property:
[Keyword<expression>, Keyword<binaryoperator>, Keyword<expression>].

In turn, each of those Keywords has an .elements array
containing the Keywords or Tokens that comprise it
(the ones it matched when it replaced them in the sentence).

(A Token also has an .elements property,
but it's just the string of characters it matched in the original text.)

### Setting Up Our Parser

Here's how our left-right parser would set up the above BNF:

parser.replace(<expression>, <binaryoperator>, <expression> ).with(<expression>)
parser.replace('NUMBER').with(<expression>)
parser.replace('PLUS_SIGN').with(<binaryoperator>)
parser.replace('MINUS_SIGN').with(<binaryoperator>)

(I'm keeping the bracketed keywords there for the sake of legibility,
but in code we would define constants like `const BINARY_OPERATOR = "<binaryoperator>"` and
would use `BINARY_OPERATOR` instead of <binaryoperator>.)

In various parser implementations, we would keep a list of possible matches
and cycle through that list each time we encounter a word we want to parse.

In a trie-based system, we'd create a hashmap for those replace/with rules
that looks more or less like this:

{
    "<expression>": {
        "<binaryoperator>": {
            "<expression>": "<expression>"
        }
    },
    "NUMBER": "<expression>",
    "PLUS_SIGN": "<binaryoperator>",
    "MINUS_SIGN": "<binaryoperator>",
}



From https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c:

For versioning:
npm version patch

To publish:
npm publish

DONE: A match function could be incredibly simple: takes a Term, returns true or false.
Let's think about use cases.

- I want to collect zero or one of X type.
- I want to collect many of X type.
- I want to collect many of _any_ type _until_ I reach an element of Y type.

Think of matching XML.

LESSTHAN, IDENTIFIER, WHITESPACE, [zero or more ATTRIBUTE_DEFINITIONS], GREATERTHAN

My matchfunction would return true if the element is an ATTRIBUTE_DEFINITION,
false if the element is a GREATERTHAN,
and undefined if the element is an IDENTIFIER or a LESSTHAN.

The trick is: if my function returns false, I return the next trie and _want the current element applied to it_.

So when I say

.replace(...WHITESPACE, somefunction, GREATERTHAN)

I need to set WHITESPACE to point to a Trie that has a function key.

That function key points to a trie that has a GREATERTHAN key.

So the function itself _does_ point to the next trie,
but when we _use_ the function, things aren't so obvious.

A trie that has a function key will be receiving a Term,
and will be prepared to return undefined as its value.

Before it does, it has to see if it has any matchFunctions. - No? Return undefined. - Yes? Reduce your match functions, with a starting accelerator of undefined. Return func(term) || acc.

TODO: Add line numbers to tokens!
Better way to do it would be to reset characterIndex every time we hit a carriage return.
