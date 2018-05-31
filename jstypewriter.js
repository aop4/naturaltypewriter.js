/*
Andrew Puglionesi
2018
*/

/* Constructor.
   Returns true on success and false on failure. */
function JSTypeWriter(config) {

	/*
	Effectively "private" members
	*/
	
	var checkElement = function(domElement, callerName) {
		if (! (domElement instanceof Element && domElement)) {
			console.error('The object passed into '+callerName+' is not an HTML element');
			return false;
		}
		return true;
	};

	var checkInterval = function(interval, callerName, intervalName) {
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
	};

	/* Returns true if prob is a valid numerical probability between 
	0 and 1. */
	var checkProbability = function(prob) {
		if (!checkInterval(prob, 'constructor', 'backtrackProbability')) {
			return false;
		}
		if (prob < 0 || prob > 1) {
			return false;
		}
		return true;
	};

	var checkText = function(text, callerName) {
		if (! (text && text.constructor === String)) {
			console.error('Empty string or invalid type for string to write into DOM element was passed into '+callerName);
			return false;
		}
		return true;
	};

	var checkArgs = function(domElement, text, callerName) {
		return ( checkElement(domElement, callerName) && checkText(text, callerName) );
	};

	var checkConfig = function(configs) {
		if (!(configs && configs.interval)) {
			console.error('You must pass a configuration object with a non-zero interval into the constructor.');
			return false;
		}
		return true;
	};

	if (typeof config == undefined || !checkConfig(config)) {
		return false;
	}
	if (!checkInterval(config.interval, 'constructor', 'interval')) {
		return false;
	}
	var interval = Math.ceil(config.interval);

	var flexibility = config.flexibility || 0;
	if (!checkInterval(flexibility, 'constructor', 'flexibility')) {
		return false;
	}
	flexibility = Math.ceil(flexibility);

	var backtrackProbability = config.backtrackProbability || 0;
	var justTypedRandomChar = false;
	if (!checkProbability(backtrackProbability)) {
		return false;
	}

	var calculateFlexibleInterval = function() {
		var timeDeltaSign = (Math.random() < 0.5) ? 1 : -1;
		var timeDeltaMagnitude = Math.floor(Math.random() * flexibility);
		var timeDelta = timeDeltaSign * timeDeltaMagnitude;
		var newInterval = interval + timeDelta;
		if (newInterval < 0) {
			return 0;
		}
		return newInterval;
	};

	var queue = [];
	var objectIsWriting = false;

	var lock = function(writeRequest) {
		if (objectIsWriting) {
			queue.push(writeRequest);
			//wait to get woken up
			return;
		}
		//execute the queued function startWriting, 
		//which starts writeChar() recursion, with the previously stored arguments
		writeRequest.execute(writeRequest.domElement, writeRequest.string, writeRequest.startIndex, writeRequest.clearElemText);
		objectIsWriting = true;
	};

	var unlock = function() {
		if (queue.length) {
			var nextRequest = queue.shift();
			//execute ("wake up") the queued function startWriting, 
			//which starts writeChar() recursion, with the previously stored arguments
			nextRequest.execute(nextRequest.domElement, nextRequest.string, nextRequest.startIndex, nextRequest.clearElemText);
		}
		else {
			objectIsWriting = false;
		}
	};

	/* Returns true with a probability equal to the argument. */
	var decideProbability = function(probability) {
		return (Math.random() < probability);
	};

	var getRandomCharacter = function() {
		//generate a lowercase letter (between ascii codes 97 and 122)
		var asciiCode = Math.floor(Math.random()*25) + 97;
		return String.fromCharCode(asciiCode);
	};

	var writeChar = function(domElement, string, index) {
		//if all characters have been written
		if (index === string.length) {
			//dequeue the next write request if applicable,
			//or free the object to accept future requests
			unlock();
			return;
		}
		var nextIndex = index + 1;
		var currChar = string.charAt(index);
		var writeAChar = true; //whether or not to write a character this iteration
		if (backtrackProbability && !justTypedRandomChar) {
			//decide whether to type a probably bad (random) character
			//based on the backtrack probability
			if (decideProbability(backtrackProbability)) {
				//select a random character to "mistype"
				currChar = getRandomCharacter();
				//indicate that we're about to type that random char
				justTypedRandomChar = true;
				nextIndex = index;
			}
		}
		//if we typed a random character in the *previous* iteration
		else if (backtrackProbability && justTypedRandomChar) {
			//delete the last character typed
			domElement.innerHTML = domElement.innerHTML.slice(0, -1);
			nextIndex = index; //start the next iteration at the same index
							   //so the correct character may be typed
			justTypedRandomChar = false;
			writeAChar = false;
		}
		//if we have to type a character (in some iterations, if there
		//is a backtrackProbability > 0, a "mistyped" character is just
		//deleted) and writeAChar is set to false
		if (writeAChar) {
			//write the current character into the domElement
			if (currChar === '\n') {
				currChar = '<br />';
			}
			domElement.innerHTML += currChar;
		}
		var timeToWait = interval;
		if (flexibility) {
			timeToWait = calculateFlexibleInterval();
		}
		setTimeout(writeChar, timeToWait, domElement, string, nextIndex);
	};

	var startWriting = function(domElement, string, startIndex, clearElemText) {
		//for calls to write(), clear previous text from the element
		if (clearElemText) {
			//clear text
			domElement.innerHTML = '';
		}
		writeChar(domElement, string, startIndex);
	};

	var writeString = function(domElement, string, clearElemText) {
		lock({'execute':startWriting, 'domElement':domElement, 'string':string, 'startIndex':0, 'clearElemText':clearElemText});
	};

	/* 
	Public methods 
	*/

	/* Returns false if an error occurred, or true on success. */
	this.write = function(domElement, text) {
		if (! checkArgs(domElement, text, 'write()')) {
			return false;
		}
		writeString(domElement, text, true);
		return true;
	};

	/* Returns false if an error occurred, or true on success. */
	this.append = function(domElement, text) {
		if (! checkArgs(domElement, text, 'append()')) {
			return false;
		}
		writeString(domElement, text, false);
		return true;
	};
}