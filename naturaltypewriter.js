/*
Andrew Puglionesi
2018
*/

/* Constructor.
   Returns true on success and false on failure.
   Config is an object containing the following properties:
	   interval (required) is the number of milliseconds between
	   the typing of each character.
	   flexibility (optional, default 0) determines the numerical range
	   for possible intervals. Use it to simulate variable speed typing:
	   any interval value in the range (interval +/- flexibility) is equally
	   likely to occur.
	   backTrackProbability (optional, default 0) is the probability that a
	   given character will be written as a random letter, deleted, and
	   rewritten to simulate human error.
	   smartBacktracking (optional, default true) causes any backtracked characters not to be chosen
	   randomly, but rather to be chosen from a set of characters near the intended character on the
	   keyboard.
	   backTrackDelay (optional, default 0) is extra delay, in milliseconds, before a character is deleted.
	   infinite (optional, default false), if it evaluates to true, causes the
	   typewriter to type continuously in an infinite loop.
	   loopWaitTime is the number of milliseconds the typewriter waits after each
	   iteration when infnite is true.
	   pauseBetweenWords is the number of milliseconds to pause between words separated
	   by whitespace.
*/
function NaturalTypewriter(config) {

	/*
	Variables and functions declared without "this." are effectively 
	private members. They can't be accessed by the user.
	*/
	var DEFAULT_FLEXIBILITY = 0;
	var DEFAULT_BACKTRACK_PROB = 0;

	var interval; //ms delay between typing characters, without flexibility
	var flexibility; //any interval value in the range (interval +/- flexibility) is equally
	   				 //likely to occur
	var backtrackProbability; //probability backtrack functionality will occur
							  //when a given char is typed
	var justTypedRandomChar; //whether the typewriter typed a random character
							 //in the previous iteration
	var infinite; //whether the typewriter will repeat the job in an infinite loop
	var loopWaitTime; //the time between loop iterations if infinite === true
	var pauseBetweenWords; //ms to pause upon encountering whitespace
	var backtrackDelay; //extra delay, in milliseconds, before a character is deleted
						//during backtracking
	var smartBacktracking; //if true, bad chars during backtracking are the near the
						   //correct char on the keyboard


	var stopJob = false; //whether to abandon the current job at the next iteration

	var queue = []; //a queue holding pending write() and append() function calls
		//(with their parameters) to wake up and execute when the current call
		//is complete
	var objectIsWriting = false; //a flag used to test whether the object
	//is writing to a domElement

	var nearbyKeyboardLetters = { //stores chars near a given key on the keyboard
		'a':['q','s','z'],
		'b':['v','g','h','n'],
		'c':['x','d','f','v'],
		'd':['e','s','x','c','f','r'],
		'e':['w','d','r'],
		'f':['r','d','c','v','g','t'],
		'g':['f','v','b','h', 'y', 't'],
		'h':['g','b','n','j', 'y'],
		'i':['u','k','o'],
		'j':['h','n','m','k', 'u'],
		'k':['j','m','l','i'],
		'l':['k','o','p'],
		'm':['n','j','k'],
		'n':['b','h','j','m'],
		'o':['i','k','l','p'],
		'p':['o','l'],
		'q':['a','w','s'],
		'r':['e','d','f','g','t'],
		's':['a','z','x','d','w'],
		't':['r','f','g','h','y'],
		'u':['y','h','j','k','i'],
		'v':['f','g','b'],
		'w':['q','s','e'],
		'x':['z','s','d','c'],
		'y':['t','h','u','g','j'],
		'z':['a','s','x'],
		',':['.'],
		'.':[',',';'],
		':':[';'],
		';':[':'],
		'?':[':'],
		'A':['Q','S','Z'],
		'B':['V','G','H','N'],
		'C':['X','D','F','V'],
		'D':['E','S','X','C','F','R'],
		'E':['W','D','R'],
		'F':['R','D','C','V','G','T'],
		'G':['F','V','B','H', 'Y', 'T'],
		'H':['G','B','N','J', 'Y'],
		'I':['U','K','O'],
		'J':['H','N','M','K', 'U'],
		'K':['J','M','L','I'],
		'L':['K','O','P'],
		'M':['N','J','K'],
		'N':['B','H','J','M'],
		'O':['I','K','L','P'],
		'P':['O','L'],
		'Q':['A','W','S'],
		'R':['E','D','F','G','T'],
		'S':['A','Z','X','D','W'],
		'T':['R','F','G','H','Y'],
		'U':['Y','H','J','K','I'],
		'V':['F','G','B'],
		'W':['Q','S','E'],
		'X':['Z','S','D','C'],
		'Y':['T','H','U','G','J'],
		'Z':['A','S','X'],
		' ':[' '], //it looks really weird when you type a letter instead of a space, so
					//I'm not allowing it
	}

	/* Returns true if domElement is a valid DOM element. */
	function checkElement(domElement, callerName) {
		if (! ((domElement instanceof Element) && domElement)) {
			console.error('The object passed into '+callerName+' is not an HTML element');
			return false;
		}
		return true;
	}

	/* Returns true if interval is a valid time interval, i.e. a
	non-negative number. */
	function checkInterval(interval, callerName, intervalName) {
		if (interval < 0) {
			console.error('The '+intervalName+' passed into '+callerName+' is not a number >= 0.');
			return false;
		}
		if (interval === 0) {
			return true;
		}
		if (! (interval && interval.constructor === Number)) {
			console.error('Invalid type for '+intervalName+' passed into '+callerName);
			return false;
		}
		return true;
	}

	/* Returns true if prob is a valid numerical probability between 
	0 and 1. */
	function checkProbability(prob) {
		if (!checkInterval(prob, 'constructor', 'backtrackProbability')) {
			return false;
		}
		if (prob < 0 || prob > 1) {
			return false;
		}
		return true;
	}

	/* Returns true if text is a string. */
	function checkText(text, callerName) {
		//allow the empty string
		if (text === '') {
			return true;
		}
		if (! (text && text.constructor === String)) {
			console.error('Invalid type for string to write into DOM element was passed into '+callerName);
			return false;
		}
		return true;
	}

	/* Returns true if domElement is a valid DOM element and text is a
	string. */
	function checkArgs(domElement, text, callerName, delay) {
		//if the delay is defined/non-zero, make sure it's a valid time interval
		if (delay && !checkInterval(delay, callerName, 'delay')) {
			return false;
		}
		return ( checkElement(domElement, callerName) && checkText(text, callerName) );
	}

	/* Returns true if the configs object is non-empty and has an interval
	property. */
	function checkConfig(configs) {
		if (!(configs && configs.interval)) {
			console.error('You must pass a configuration object with a non-zero interval into the constructor.');
			return false;
		}
		return true;
	}

	/* If pauseBetweenWords is non-zero and character is whitespace, this returns it.
	Used when flexibility != 0, i.e., the user wants the typing speed
	to vary from character to character. A value in the range
	[-flexibility, flexibility] is added to the object's interval attribute,
	and the result is returned to give a new interval in the range 
	[interval +/- flexibility]. If this number is negative, 0 is used
	as the interval. If charIsMistyped is true (a bad character was just typed),
	backTrackDelay is added to the computed interval.*/
	function calculateFlexibleInterval(character, charIsMistyped) {
		if (pauseBetweenWords && (character === ' ' || character === '\n')) {
			return pauseBetweenWords;
		}
		//randomly choose a sign (positive or negative) for the value to add to interval
		var timeDeltaSign = (Math.random() < 0.5) ? 1 : -1;
		//randomly choose a magnitude
		var timeDeltaMagnitude = Math.ceil(Math.random() * flexibility);
		var timeDelta = timeDeltaSign * timeDeltaMagnitude;
		var newInterval = interval + timeDelta;
		//don't allow negative intervals to occur
		if (newInterval < 0) {
			newInterval = 0;
		}
		if (charIsMistyped) {
			newInterval += backtrackDelay;
		}
		return newInterval;
	}

	/* Pushes a function call, with parameters, to the queue if the
	object is already writing/appending data to a DOM element. If
	the object isn't writing, simply executes the function call. */
	function lock(writeRequest) {
		if (objectIsWriting) {
			queue.push(writeRequest);
			//wait to get woken up
			return;
		}
		//execute the queued function (currently bound to be startWriting), 
		//which starts writeChar() recursion, with the stored arguments
		writeRequest.execute(writeRequest.domElement, writeRequest.string,
			writeRequest.startIndex, writeRequest.clearElemText, 
			writeRequest.callback, writeRequest.delay);
		objectIsWriting = true;
	}

	/* Called when a NaturalTypewriter reaches the end of the string it's
	writing. Dequeues and executes any queued function calls, or resets
	the objectIsWriting attribute to false if none are queued anymore. */
	function unlock() {
		//if the queue isn't empty
		if (queue.length) {
			//pop the next write request from the queue
			var nextRequest = queue.shift();
			//execute ("wake up") the queued function startWriting, 
			//which starts writeChar() recursion, with the arguments
			//stored when the function was queued.
			nextRequest.execute(nextRequest.domElement, nextRequest.string, nextRequest.startIndex, 
				nextRequest.clearElemText, nextRequest.callback,
				nextRequest.delay);
		}
		//if the queue is empty (all write/append calls thus far are completed)
		else {
			objectIsWriting = false;
		}
	}

	/* Returns true with a probability equal to the argument. */
	function decideProbability(probability) {
		return (Math.random() < probability);
	}

	/* When possible, queries nearbyKeyboardLetters for current character
	and returns a character next to it on a US keyboard. Otherwise, it returns
	a random letter. */
	function getSmartRandomCharacter(currChar) {
		//get an array of characters near to currChar on the keyboard
		var nearbyChars = nearbyKeyboardLetters[currChar];
		//if any are found
		if (nearbyChars) {
			//pick a random nearby character (a random element in the array)
			return nearbyChars[Math.floor( Math.random()*nearbyChars.length )];
		}
		else {
			//return a random letter
			return getRandomCharacter();
		}
	}

	/* Generate a random character in [a-z] */
	function getRandomCharacter() {
		//generate a lowercase letter (between ascii codes 97 and 122)
		var asciiCode = Math.floor(Math.random()*25) + 97;
		return String.fromCharCode(asciiCode);
	}

	/* Deletes the final numChars characters from the text of
	domElement */
	function deleteCharsFromElement(domElement, numChars) {
		if (numChars <= 0) {
			return;
		}
		else if (numChars >= domElement.innerHTML.length) {
			clearElementText(domElement);
		}
		domElement.innerHTML = domElement.innerHTML.slice(0, numChars * -1);
	}

	/* Physically writes a character to domElement, replacing any '\n' with a <br>
	element. (text could also be a 2+ character string, in theory.)*/
	function appendToDomElement(domElement, text) {
		text = text.replace(/\n/g, '<br />');
		domElement.innerHTML += text;
	}

	function clearQueue() {
		queue = [];
	}

	/* The meat of things. If backtrackProbability is 0, writeChar() just 
	writes the indexth character of string into domElement, then
	sets a timeout that will call itself to write the next character
	after the desired interval passes.
	If backtrack probability is not 0, it may enter into a
	cycle (with a probability of backtrackProbability) where it writes
	a random character, deletes it after one interval, and then starts
	where it left off at the next interval, like a person mistyping a
	character, deleting it, and retyping it... which I just did several
	times. */
	function writeChar(domElement, string, index, clearElemText, callback) {
		//if stopJob is true, abandon this job
		//and execute any queued jobs
		if (stopJob) {
			stopJob = false;
			unlock(); //anything in the queue was added after killActivity was called; execute it
			return;
		}
		//if all characters in string have been written
		if (index === string.length) {
			//execute the callback function
			if (callback) {
				callback();
			}
			if (infinite) {
				//re-type the phrase after loopWaitTime ms
				startWriting(domElement, string, 0, clearElemText, callback, loopWaitTime);
			}
			else {
				//dequeue the next write request if applicable,
				//or free the object to accept future requests
				unlock();
			}
			//stop recursing
			return;
		}
		var nextIndex = index + 1; //the index in string of the next char to write
		var currChar = string.charAt(index);
		var writeAChar = true; //whether or not to write a character this iteration
		if (backtrackProbability && !justTypedRandomChar) {
			//decide whether to type a probably bad (random) character
			//based on the backtrack probability
			if (decideProbability(backtrackProbability)) {
				//select a random character to "mistype"
				currChar = (smartBacktracking ? getSmartRandomCharacter(currChar) : getRandomCharacter());
				//indicate, for the next iteration, that we're typing a random char
				justTypedRandomChar = true;
				//do not increment index for the next function call. We won't be writing
				//the (index + 1)th character for at least two iterations
				nextIndex = index;
			}
		}
		//if we typed a random character in the *previous* iteration, delete it
		else if (backtrackProbability && justTypedRandomChar) {
			//delete the last character typed
			deleteCharsFromElement(domElement, 1);
			nextIndex = index; //start the next iteration at the same index
							   //so the correct character may be typed
			justTypedRandomChar = false;
			writeAChar = false; //because we're not writing a character this iteration
		}
		//if we have to type a character
		if (writeAChar) {
			//write the current character into the domElement
			appendToDomElement(domElement, currChar);
		}
		var timeToWait = interval;
		if (flexibility || pauseBetweenWords) {
			timeToWait = calculateFlexibleInterval(currChar, justTypedRandomChar);
		}
		//call this function (recursively) to write the nextIndexth character
		//of string after timeToWait milliseconds
		setTimeout(writeChar, timeToWait, domElement, string, nextIndex, clearElemText,
			callback);
	}

	/* Begins the recursive call chain that writes each character of string
	to domElement. Clears the text of domElement if clearElemText evaluates to true. */
	function execCommand(domElement, string, startIndex, clearElemText,
		callback) {
		//for calls to write(), clear previous text from the element
		if (clearElemText) {
			//clear text
			clearElementText(domElement);
		}
		//start writing string to domElement--initialize a recursive call chain
		writeChar(domElement, string, startIndex, clearElemText, callback);
	}

	/* Clears the text (and other content, including nested divs) of domElement */
	function clearElementText(domElement) {
		domElement.innerHTML = '';
	}

	/* Begins execution of a queued write() or append() command, enforcing
	an initial delay if applicable. */
	function startWriting(domElement, string, startIndex, clearElemText,
		callback, delay) {
		//if the user specified a delay for this operation
		if (delay) {
			//call execCommand() after delay milliseconds
			setTimeout(execCommand, delay, domElement, string, startIndex,
				clearElemText, callback);
		}
		else {
			//call execCommand() immediately
			execCommand(domElement, string, startIndex, clearElemText, 
				callback);
		}
	}

	/* Queues or executes a requested write()/append() call (see lock()) */
	function writeString(domElement, string, clearElemText, callback, delay) {
		//requestData['execute'] is the function to queue (if this object is 
		//currently writing to a DOM element) or execute in lock(),
		//and the rest of requestData's properties are the parameters
		//to pass to that function
		var requestData = {'execute':startWriting, 'domElement':domElement,
		'string':string, 'startIndex':0, 'clearElemText':clearElemText,
		'callback':callback, 'delay':delay};
		lock(requestData);
	}

	/* Check the arguments for and queue/execute a write/append command.
	Returns true if the command is executed correctly. */
	function processCommand(domElement, text, commandName, clearDomElement, 
		callback, delay) {
		//ensure the arguments are a valid domElement and string
		if (! checkArgs(domElement, text, commandName, delay)) {
			return false;
		}
		//call writeString, indicating with clearDomElement whether 
		//the text in domElement should be cleared once the operation
		//is executed/dequeued.
		writeString(domElement, text, clearDomElement, callback, delay);
		return true;
	}

	/* 
	Public methods 
	*/

	/* Clear writeConfig.domElement and then write writeConfig.text into it.
	writeConfig.delay specifies an optional delay before the operation will occur,
	and writeConfig.callback optionally specifies a callback function to execute
	after writing.
	Returns false if an error occurred, or true on success. */
	this.write = function(writeConfig) {
		return processCommand(writeConfig.domElement, writeConfig.text, 
			'write()', true, writeConfig.callback, writeConfig.delay);
	};

	//D.R.Y.

	/* Command to append appendConfig.text to appendConfig.domElement. 
	appendConfig.delay specifies an optional delay before the operation will occur,
	and appendConfig.callback optionally specifies a callback function to execute
	after appending.
	Returns false if an error occurred, or true on success. */
	this.append = function(appendConfig) {
		return processCommand(appendConfig.domElement, appendConfig.text, 
			'append()', false, appendConfig.callback, appendConfig.delay);
	};

	/* Clears the queue--abandons all pending write requests. */
	this.clearQueue = function() {
		clearQueue();
	}

	/* Permanently halts the current job and all pending jobs */
	this.killActivity = function() {
		if (objectIsWriting) {
			stopJob = true;
		}
		clearQueue();
	}

	/*************************************
	Logic executed upon initialization.
	*************************************/
	function setup() {
		//ensure the config object passed into the constructor is usable.
		if (typeof config == undefined || !checkConfig(config)) {
			console.error("Invalid or missing config object passed into constructor");
			return false;
		}
		//ensure the interval is valid
		if (!checkInterval(config.interval, 'constructor', 'interval')) {
			return false;
		}
		//if the interval was a floating point number, just round it up
		//since it will be used in setTimeout().
		interval = Math.ceil(config.interval);

		flexibility = config.flexibility || DEFAULT_FLEXIBILITY;
		if (!checkInterval(flexibility, 'constructor', 'flexibility')) {
			return false;
		}
		//if the flexibility was a floating point number, round it up as well
		flexibility = Math.ceil(flexibility);

		backtrackProbability = config.backtrackProbability || DEFAULT_BACKTRACK_PROB;
		//ensure the backtrack probability passed in is in the range [0, 1]
		if (!checkProbability(backtrackProbability)) {
			return false;
		}
		justTypedRandomChar = false; //flag to indicate whether a random character
						//(to simulate mistyping) was typed in the previous "keystroke"

		infinite = config.infinite;
		loopWaitTime = config.loopWaitTime || 0;
		if (!checkInterval(loopWaitTime, 'constructor', 'loopWaitTime')) {
			return false;
		}
		loopWaitTime = Math.ceil(loopWaitTime);
		pauseBetweenWords = config.pauseBetweenWords || 0;
		if (!checkInterval(pauseBetweenWords, 'constructor', 'pauseBetweenWords')) {
			return false;
		}
		pauseBetweenWords = Math.ceil(pauseBetweenWords);
		backtrackDelay = config.backtrackDelay || 0;
		if (!checkInterval(backtrackDelay, 'constructor', 'backtrackDelay')) {
			return false;
		}
		backtrackDelay = Math.ceil(backtrackDelay);

		smartBacktracking = true; //make true by default
		if (config.smartBacktracking === false) {
			smartBacktracking = false;
		}
		//all checks passed
		return true;
	}

	/* Set up module for tests if applicable */
	if (config.debug) {
		this._clearElementText = clearElementText;
		this._checkElement = checkElement;
		this._checkInterval = checkInterval;
		this._checkProbability = checkProbability;
		this._checkText = checkText;
		this._checkArgs = checkArgs;
		this._lock = lock;
		this._unlock = unlock;
		this._decideProbability = decideProbability;
		this._deleteCharsFromElement = deleteCharsFromElement;
		this._appendToDomElement = appendToDomElement;
		this._clearQueue = clearQueue;
		this._setQueue = function(q) {
			queue = q;
		}
		this._getQueue = function() {
			return queue;
		}
		this._setObjectIsWriting = function(val) {
			objectIsWriting = val;
		}
		this._getObjectIsWriting = function() {
			return objectIsWriting;
		}
		this._startWriting = startWriting;
		this._writeChar = writeChar;
	}

	return setup();

}
