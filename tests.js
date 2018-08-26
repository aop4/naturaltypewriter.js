describe("Typewriter test suite", function() {
	
	var testParagraph;
	var writer;

	beforeEach(function() {
		writer = new NaturalTypewriter({
			interval: 70,
			debug: true
		});
		testParagraph = document.createElement("p");
	});

	afterEach(function() {

	});

	it("deletes no element text when numChars is 0", function() {
		testParagraph.innerHTML = "ABCDE";
		writer._deleteCharsFromElement(testParagraph, 0);
		expect(testParagraph.innerHTML).toEqual("ABCDE");
	});

	it("deletes element text when numChars is positive", function() {
		testParagraph.innerHTML = "ABCDE";
		writer._deleteCharsFromElement(testParagraph, 1);
		expect(testParagraph.innerHTML).toEqual("ABCD");
	});

	it("deletes all element text when numChars is as long as element text", function() {
		testParagraph.innerHTML = "ABCDE";
		writer._deleteCharsFromElement(testParagraph, 5);
		expect(testParagraph.innerHTML).toEqual("");
	});

	it("deletes all element text when numChars is longer than element text", function() {
		testParagraph.innerHTML = "ABCDE";
		writer._deleteCharsFromElement(testParagraph, 6);
		expect(testParagraph.innerHTML).toEqual("");
	});

	it("doesn't delete element text when numChars is negative", function() {
		testParagraph.innerHTML = "ABCDE";
		writer._deleteCharsFromElement(testParagraph, -1);
		expect(testParagraph.innerHTML).toEqual("ABCDE");
	});

	it("clears element text", function() {
		testParagraph.innerHTML = "ABCDE";
		writer._clearElementText(testParagraph);
		expect(testParagraph.innerHTML).toEqual("");
	});

	it("rejects nonexistent DOM elements", function() {
		nonexistentDomElement = document.getElementById("bad-dom-id-a144452");
		expect(writer._checkElement(nonexistentDomElement)).toBe(false);
	});

	it("accepts existent DOM elements", function() {
		expect(writer._checkElement(testParagraph)).toBe(true);
	});

	it("rejects nonsense DOM elements", function() {
		expect(writer._checkElement(1)).toBe(false);
		expect(writer._checkElement("chicken")).toBe(false);
		expect(writer._checkElement(writer._checkElement)).toBe(false);
	});

	it("rejects null DOM elements", function() {
		expect(writer._checkElement(null)).toBe(false);
	});

	it("rejects null intervals", function() {
		expect(writer._checkInterval(null)).toBe(false);
	});

	it("rejects negative intervals", function() {
		expect(writer._checkInterval(-1)).toBe(false);
	});

	it("accepts intervals of 0", function() {
		expect(writer._checkInterval(0)).toBe(true);
	});

	it("rejects non-number intervals", function() {
		expect(writer._checkInterval("ABCD")).toBe(false);
	});

	it("rejects negative probabilities", function() {
		expect(writer._checkProbability(-1)).toBe(false);
	});

	it("accepts 0 probabilities", function() {
		expect(writer._checkProbability(0)).toBe(true);
	});

	it("accepts midrange probabilities", function() {
		expect(writer._checkProbability(0.4)).toBe(true);
	});

	it("accepts probabilities of 1", function() {
		expect(writer._checkProbability(1)).toBe(true);
	});

	it("rejects probabilities > 1", function() {
		expect(writer._checkProbability(1.001)).toBe(false);
	});

	it("doesn't accept null text", function() {
		expect(writer._checkText(null)).toBe(false);
	});

	it("accepts empty text", function() {
		expect(writer._checkText("")).toBe(true);
	});

	it("accepts non-empty text", function() {
		expect(writer._checkText("AB")).toBe(true);
	});

	it("rejects nonsense text", function() {
		expect(writer._checkText(123)).toBe(false);
	});

	it("accepts write/append args when all are valid", function() {
		expect(writer._checkArgs(testParagraph, "text", "caller", 0)).toBe(true);
	});

	it("rejects write/append args when text is invalid", function() {
		expect(writer._checkArgs(testParagraph, null, "caller", 0)).toBe(false);
	});

	it("rejects write/append args when domElement is invalid", function() {
		expect(writer._checkArgs(null, "text", "caller", 0)).toBe(false);
	});

	it("rejects write/append args when interval is invalid", function() {
		expect(writer._checkArgs(testParagraph, "text", "caller", -1)).toBe(false);
	});

	it("pushes an element to the queue when lock is called and objectIsWriting is true",
	function() {
		var lockWriter = new NaturalTypewriter({
			interval: 5,
			debug: true
		});
		lockWriter._setObjectIsWriting(true);
		lockWriter._lock("test string");
		expect(lockWriter._getQueue()[0]).toEqual("test string");
	});

	it("sets objectIsWriting to true when unlock() is called and the queue is empty",
	function() {
		var lockWriter = new NaturalTypewriter({
			interval: 5,
			debug: true
		});
		lockWriter._setObjectIsWriting(true);
		lockWriter._unlock({});
		expect(lockWriter._getObjectIsWriting()).toBe(false);
	});

	it("properly appends text to domElement", function() {
		testParagraph.innerHTML = "v";
		writer._appendToDomElement(testParagraph, "a");
		expect(testParagraph.innerHTML).toEqual("va");
	});

	it("converts \\n to <br>", function() {
		testParagraph.innerHTML = "a";
		writer._appendToDomElement(testParagraph, "\n");
		expect(testParagraph.innerHTML).toEqual("a<br>");
	});

	it("converts multiple newlines to <br>", function() {
		writer._appendToDomElement(testParagraph, "\n\n");
		expect(testParagraph.innerHTML).toEqual("<br><br>");
	});

	it("does not convert escaped newlines", function() {
		writer._appendToDomElement(testParagraph, "\\n");
		expect(testParagraph.innerHTML).toEqual("\\n");
	});

	it("clears the queue properly", function() {
		writer._setQueue(["a", "b"]);
		writer.clearQueue();
		expect(writer._getQueue().length).toEqual(0);
	});

	/*
		Pure JavaScript is not very testable. The NaturalTypewriter "class"
		has a lot of private (actually function-scope) functions, and it's 
		not really possible to stub those while keeping them private. More tests
		will be added if I change this into a TypeScript module and compile
		it into JS. That would require quite a bit of manual regression testing.
		The below are integration tests.
	*/

	function appendToParagraph(writerObj, text, callbackFunction) {
		writerObj.append({
			domElement: testParagraph,
			text: text,
			callback: callbackFunction
		})
	}

	function writeToParagraph(writerObj, text, callbackFunction) {
		writerObj.write({
			domElement: testParagraph,
			text: text,
			callback: callbackFunction
		})
	}

	it("executes writes serially", function(done) {
		//test that one typewriter with 2 jobs executes first one,
		//then the other
		function test() {
			expect(testParagraph.innerHTML).toEqual("Hello, world.");
			done();
		}
		appendToParagraph(writer, "Hello, ", null);
		appendToParagraph(writer, "world.", test);
	});

	it("clears domElement text on write", function(done) {
		testParagraph.innerHTML = "bloop";
		function test() {
			expect(testParagraph.innerHTML).toEqual("H");
			done();
		}
		writeToParagraph(writer, "H", test);
	});

	/* Explicitly test write callbacks */
	it("executes write callbacks", function(done) {
		callbackTestHelper('write', done);
	});

	/* Explicitly test append callbacks */
	it("executes append callbacks", function(done) {
		callbackTestHelper('append', done);
	});

	function callbackTestHelper(functionName, done) {
		var x = 2;
		function callback() {
			x = 4;
		}
		function test() {
			expect(x).toEqual(4);
			done();
		}
		writer[functionName]({
			domElement: testParagraph,
			text: "a",
			callback: function() {
				callback();
				test();
			}
		});
	}

	it("queues pending writes", function(done) {
		writeToParagraph(writer, "hello", null);
		writeToParagraph(writer, "world", null);
		assertQueueLength(1, done);
	});

	it("queues pending appends", function(done) {
		appendToParagraph(writer, "hello", null);
		appendToParagraph(writer, "world", null);
		assertQueueLength(1, done);
	});

	it("abandons pending jobs after killActivity is called", function(done) {
		function test() {
			expect(testParagraph.innerHTML).toEqual("hello");
			done();
		}
		//write "hello" and then call writer.killActivity as a callback
		appendToParagraph(writer, "hello", writer.killActivity);
		//immediately call another write command, which is queued
		appendToParagraph(writer, " world", null);
		setTimeout(test, 1000); //give ample time for both writes to occur,
								//and verify that the second didn't happen
	});

	it("dequeues pending jobs after killActivity is called", function() {
		appendToParagraph(writer, "hello", null);
		appendToParagraph(writer, " world", null);
		writer.killActivity();
		assertQueueLength(0, () => {});
	});

	function assertQueueLength(len, done) {
		expect(writer._getQueue().length).toEqual(len);
		done();
	}

});

