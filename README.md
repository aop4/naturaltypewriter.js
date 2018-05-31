# naturaltypewriter.js
A simple native JavaScript library to simulate someone typing in a DOM element. It shoots for a more "natural" feel, where an actual person might be adding the text.

## Use
Include in your page `<script src="naturaltypewriter.js"></script>`

```
var writer = new NaturalTypewriter();
//append the string textToAppend to the element
writer.append(domElement, textToAppend, msBetweenChars);
//clear the element of any text and write the string textToAppend into it
writer.write(domElement, textToAppend, msBetweenChars);
```
A more specific use case:
```
//say we have a <p> tag `<p id="img-description"></p>`
var imageDescription = document.getElementById('img-description');
var writer = new NaturalTypewriter();
writer.write(imageDescription, 'This is the best image ever', 200);
```

## Concurrency
-If you want to have two "typewriters" running at the same time, you need to instantiate two objects.
-By design a NaturalTypewriter object keeps itself from running two commands simultaneously, but it leaves your code free to run while it's at work. The former is accomplished with a locking mechanism, and for the latter you can thank timeouts--there are no infinite loops to implement pauses here. tl;dr: Informal performance analysis revealed that a long test required less than 7% of the Chrome JavaScript engine's time (the rest was spent idle). The largest contributors to running time seem to be timeouts and visual rendering, and this wouldn't work very well without pausing or writing characters, would it?


## Side effects
-Creates the NaturalTypewriter global variable.
-Instructive error messages will be written to the console in the event that nonsense arguments are passed in. Generally these mistakes will prevent the offending "typewriting" request from occurring.
-A stack overflow is theoretically possible. Under the hood, this uses recursion. The number of recursive calls is proportional to the length of the string you're writing. As long as you don't ask it to write Moby Dick in one go (which, if you think about it, makes no sense), you should be fine. But if you do ask it to write Moby Dick all at once, you might get a stack overflow error. The maximum size of the stack differs in different browsers, but it's pretty large. In the interest of keeping this tool versatile, there's no limit to the length of your strings.
-A NaturalTypewriter object can't write in two places at the same time. If it's asked to write to an element while it's in the process of writing to any element, it will finish the first requested write, then begin the second, and so on, sequentially, like an actual typist. This makes it easy to plan out sequential typing on your pages. However, when multiple NaturalTypewriter objects are used simultaneously, they run simultaneously. If they're used to write in the same element, it'll result in a jumbled mess, so it would be best to use separate HTML (perhaps `span`) elements for that sort of thing.
-If this is inserting user input into the page, guess whose job it is to make sure that input is sanitized? Your job, as usual :)

