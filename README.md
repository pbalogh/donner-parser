# donner-parser
TODO: Try a demo with XML parsing
    

TODO: Helpful error messages based on what kind of Keyword we're left with.
Is this keyword in our trie? If so, where? Does it need to be followed by something?
(We can look in our result sentence to see if it is -- and then chase *that* down)
Or does it need to be *following* something? 

A library that lets you build a trie to use for fast searching

From https://itnext.io/step-by-step-building-and-publishing-an-npm-typescript-package-44fe7164964c:

For versioning:
npm version patch

To publish:
npm publish







DONE: A match function could be incredibly simple: takes a Term, returns true or false.
Let's think about use cases.

- I want to collect zero or one of X type.
- I want to collect many of X type.
- I want to collect many of *any* type *until* I reach an element of Y type.

Think of matching XML.

LESSTHAN, IDENTIFIER, WHITESPACE, [zero or more ATTRIBUTE_DEFINITIONS], GREATERTHAN

My matchfunction would return true if the element is an ATTRIBUTE_DEFINITION,
false if the element is a GREATERTHAN,
and undefined if the element is an IDENTIFIER or a LESSTHAN.

The trick is: if my function returns false, I return the next trie and *want the current element applied to it*.

So when I say 

.replace(...WHITESPACE, somefunction, GREATERTHAN)

I need to set WHITESPACE to point to a Trie that has a function key.

That function key points to a trie that has a GREATERTHAN key.

So the function itself *does* point to the next trie,
but when we *use* the function, things aren't so obvious.

A trie that has a function key will be receiving a Term,
and will be prepared to return undefined as its value.

Before it does, it has to see if it has any matchFunctions.
    - No? Return undefined.
    - Yes? Reduce your match functions, with a starting accelerator of undefined. Return func(term) || acc.

TODO: Add line numbers to tokens!
Better way to do it would be to reset characterIndex every time we hit a carriage return.
