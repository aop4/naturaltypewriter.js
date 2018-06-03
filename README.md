# naturaltypewriter.js
A simple native JavaScript library to simulate someone typing in a DOM element. It shoots for a more "natural" feel, where an actual person might be adding the text.

# <a href="http://www.andrewpuglionesi.com/typewriter" target="_blank">Demo</a>

## Use
Include in your page `<script src="naturaltypewriter.js"></script>`

### Constructor
```
var config = {
  'interval':msBetweenChars,
  'flexibility':variabilityInInterval,
  'backtrackProbability':probabilityOfBacktracking,
  'backtrackDelay':delayBeforeDelete,
  'infinite':loopRepeatedly,
  'loopWaitTime':msBetweenLoops,
  'pauseBetweenWords':msBetweenWords
};
var writer = new NaturalTypewriter(config);

```
`interval` (required) is the number of milliseconds between the typing of each character.  
`flexibility` (optional, default 0) determines the numerical range for possible intervals. Use it to simulate variable speed typing: any interval value in the range (interval +/- flexibility) is equally likely to occur. The range is truncated at 0 to prevent negative intervals from occuring.  
`backTrackProbability` (optional, default 0) is the probability that a given character will be written as a random letter, deleted, and rewritten to simulate human error. Values above 0.05 cause it to look kind of unrealistic/clumsy.  
`backtrackDelay` (optional, default 0) is an extra delay, in milliseconds, before a character is deleted.  
`infinite` (optional, default false), if it evaluates to true, causes the
typewriter to type its first requested string continuously in an infinite loop. Once in this loop, the typewriter cannot fulfill another request.  
`loopWaitTime` (optional, default 1000) is the number of milliseconds the typewriter waits after each
iteration when infnite is true.  
`pauseBetweenWords` (optional, default whatever the interval is) is the number of milliseconds to pause between words separated by whitespace (newlines and spaces).  

Suggested starting points for these paramaters can be found in the use case,
but I suggest playing around with them to obtain your desired effect.  

### NaturalTypewriter.append()
```
writer.append(domElement, text);
```
Appends `text` to `domElement`'s HTML content.  
`domElement` is the DOM element to append text to. It must be a native DOM element.  
`text` is the text to write. It must be a string. Newlines (`'\n'`) are escaped as `<br>` elements and so work as expected. They can be depicted directly with `'\\n'.`  

### NaturalTypewriter.write()
```
writer.write(domElement, text);
```
Caution: clears any content currently in `domElement` and writes `text` into `domElement`.  
`domElement` is the DOM element to clear and then write to. It must be a native DOM element.  
`text` is the text to write. It must be a string. Newlines (`'\n'`) are escaped as `<br>` elements and so work as expected. They can be depicted directly with `'\\n'`.  

## Example use case  

```
//say we have a <p> tag `<p id="img-description"></p>`
var writer = new NaturalTypewriter({'interval':40, 'flexibility':39, 'backtrackProbability':0.0});

var imageDescription = document.getElementById('img-description');

writer.append(imageDescription, 'This is the best image ever');
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

