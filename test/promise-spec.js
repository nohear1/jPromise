var p = require("../promise.js");
var adapter = require("./adapter.js");
var assert = require("assert");
var sinon = require('sinon');

function isFunction(a) {
	return !!(a && Object.prototype.toString.call(a) === '[object Function]');
};

describe("Promise.js Deferred Promise class", function() {
	it("sets up a global constructor p", function() {
		assert.notEqual(p, undefined);
		assert(p);
	});

	describe("returns a deferred constructor that can be newed up", function() {
		it("can be called with a beforeStart function which will receive the deferred object", function() {
			var spy = {
				func: function() {}
			};
			sinon.spy(spy, "func");

			var dfd = new p(spy.func);
			assert(spy.func.called, "beforeStart spy was not called");
			assert.equal(dfd.toString(), "[object Deferred]", "returned Object was not a Deferred");
		});

		it("or newed up with no arguments, which is the more standard condition", function() {
			var dfd = new p();
			assert.equal(dfd.toString(), "[object Deferred]", "returned Object was not a Deferred");
		});

	});

	describe("the Deferred object is not safe to give around and as such exposes properties.  Worth it for performance IMO.", function() {
		it("has an internalState property that you could read manually if you wanted... setting would bork things", function() {
			var dfd = new p();
			assert.equal(dfd.internalState, 0, "internalState should equal 0 when pending");
			assert.equal(Object.keys(dfd).length, 0, "Object.keys should equal 0 since the props are non enumerable");

			dfd.reject();
			assert.equal(dfd.internalState, 2, "internalState should equal 2 when rejected");
			
			dfd = new p();
			dfd.resolve();
			assert.equal(dfd.internalState, 1, "internalState should equal 1 when resolved");
			
		});

		it("has an internalWith property that that is undefined by default, a way to sanitize 'this' with all the callbacks", function() {
			var dfd = new p();
			assert.equal(dfd.internalWith, undefined, "internalWith should be undefined by default");

			var obj = {};
			dfd.resolveWith(obj);
			assert.equal(dfd.internalWith, obj, "internalWith should be the obj provided to rejectWith or resolveWith");
		});

		it("has an internalData property that is the data with which the deferred was resolved/rejected etc", function() {
			var dfd = new p();
			assert.equal(dfd.internalData, null, "internalData should be null by default");

			var obj = {};
			dfd.resolve(obj);
			assert.equal(dfd.internalData, obj, "internalData should be the obj provided to reject or resolve");
		});

		it("has an callbacks property that logs the callbacks that have been registered", function() {
			var dfd = new p();
			assert.equal(dfd.callbacks.done.length, 0, "callbacks.done should be 0 when inited");
			assert.equal(dfd.callbacks.fail.length, 0, "callbacks.fail should be 0 when inited");
			assert.equal(dfd.callbacks.always.length, 0, "callbacks.always should be 0 when inited");
			assert.equal(dfd.callbacks.progress.length, 0, "callbacks.progress should be 0 when inited");

			var promise = dfd.promise();
			var func1 = function() {};
			var func2 = function() {};
			var func3 = function() {};
			var func4 = function() {};
			promise.done(func1);
			promise.fail(func2);
			promise.always(func3);
			promise.progress(func4);

			assert.equal(dfd.callbacks.done.length, 1, "callbacks.done should be 1");
			assert.equal(dfd.callbacks.fail.length, 1, "callbacks.fail should be 1");
			assert.equal(dfd.callbacks.always.length, 1, "callbacks.always should be 1");
			assert.equal(dfd.callbacks.progress.length, 1, "callbacks.progress should be 1");

			assert.equal(dfd.callbacks.done[0],func1);
			assert.equal(dfd.callbacks.fail[0],func2);
			assert.equal(dfd.callbacks.always[0],func3);
			assert.equal(dfd.callbacks.progress[0],func4);
		});
	});

	describe("the deferred object exposes a safe promise subclass which allows only registration of callbacks", function() {
		it("returns a new promise object when dfd.promise() is called", function() {
			var dfd = new p();
			var promise = dfd.promise();

			assert.equal(promise.dfd, undefined)
			assert.equal(promise.toString(), "[object Promise]");
			assert(isFunction(promise.done));
			assert(isFunction(promise.fail));
			assert(isFunction(promise.always));
			assert(isFunction(promise.progress));
			assert(isFunction(promise.then));
			assert(isFunction(promise.state));
			assert.equal(promise.state(), 0);
		});

		it("adds the promise properties and methods onto an existing object when an object is passed to promise()... promisifying it... hell yeah", function() {
			var dfd = new p();
			var obj = {
				foo: "bar"
			};
			var promise = dfd.promise(obj);

			assert.equal(promise.dfd, undefined)
			assert.equal(promise.toString(), "[object Promise]");
			assert(isFunction(promise.done));
			assert(isFunction(promise.fail));
			assert(isFunction(promise.always));
			assert(isFunction(promise.progress));
			assert(isFunction(promise.then));
			assert(isFunction(promise.state));
			assert.equal(promise.state(), 0);
			assert.equal(promise.foo, "bar");
		});
	});

	describe("the callbacks are safely registered to the deferred callbacks when using the by the promise subscription methods", function() {
		it("promise.done() adds callbacks to the deferred callbacks.done array", function() {
			var dfd = new p();
			var promise = dfd.promise();

			assert.equal(dfd.callbacks.done.length, 0);
			var func1 = function() {};
			promise.done(func1);
			assert.equal(dfd.callbacks.done.length, 1);
			assert.equal(dfd.callbacks.done[0], func1);
		});

		it("promise.fail() adds callbacks to the deferred callbacks.fail array", function() {
			var dfd = new p();
			var promise = dfd.promise();

			assert.equal(dfd.callbacks.fail.length, 0);
			var func1 = function() {};
			promise.fail(func1);
			assert.equal(dfd.callbacks.fail.length, 1);
			assert.equal(dfd.callbacks.fail[0], func1);
		});

		it("promise.always() adds callbacks to the deferred callbacks.always array", function() {
			var dfd = new p();
			var promise = dfd.promise();

			assert.equal(dfd.callbacks.always.length, 0);
			var func1 = function() {};
			promise.always(func1);
			assert.equal(dfd.callbacks.always.length, 1);
			assert.equal(dfd.callbacks.always[0], func1);
		});

		it("promise.progress() adds callbacks to the deferred callbacks.progress array", function() {
			var dfd = new p();
			var promise = dfd.promise();

			assert.equal(dfd.callbacks.progress.length, 0);
			var func1 = function() {};
			promise.progress(func1);
			assert.equal(dfd.callbacks.progress.length, 1);
			assert.equal(dfd.callbacks.progress[0], func1);
		});

		it("promise.then() returns a new promise that runs the old promise through filter functions on return", function() {
			var dfd = new p();
			var promise = dfd.promise();

			var func1 = function() {};
			var func2 = function() {};
			var func3 = function() {};

			var thenPromise = promise.then(func1, func2, func3);
			assert.equal(thenPromise.toString(), "[object Promise]");
		})
	});

	describe("the deferred object is used to resolve/reject/notify to the subscriptions on the promise", function() {
		it("resolve calls both done and always callbacks", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			var count = 0;

			promise.done(function() {
				count++;
				assert.equal(count, 1);
			});

			promise.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});

			dfd.resolve();
		});

		it("resolveWith calls both done and always callbacks and the callback is scoped to the first param of resolveWith", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			var obj = {};
			var count = 0;

			promise.done(function() {
				count++;
				assert.equal(count, 1);
				assert.equal(this, obj);
			});

			promise.always(function() {
				count++;
				assert.equal(count, 2);
				assert.equal(this, obj);
				done();
			});

			dfd.resolveWith(obj);
		});

		it("reject calls both fail and always callbacks", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			var count = 0;

			promise.fail(function() {
				count++;
				assert.equal(count, 1);
			});

			promise.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});

			dfd.reject();
		});

		it("rejectWith calls both fail and always callbacks and the callback is scoped to the first param of resolveWith", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			var obj = {};
			var count = 0;

			promise.fail(function() {
				count++;
				assert.equal(count, 1);
				assert.equal(this, obj);
			});

			promise.always(function() {
				count++;
				assert.equal(count, 2);
				assert.equal(this, obj);
				done();
			});

			dfd.rejectWith(obj);
		});

		it("notify calls progress callbacks", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			var count = 0;

			promise.progress(function() {
				count++;
				assert.equal(count, 1);
				done();
			});

			dfd.notify();
		});

		it("notify can be called multiple times with progress being called each time", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			var count = 0;

			promise.progress(function() {
				assert.equal(count, count++);
				if(count > 2) {
					done();
				}
			});

			dfd.notify();
			dfd.notify();
			dfd.notify();
		});

		it("notifyWith calls progress callbacks and the callback is scoped to the first param of resolveWith", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			var obj = {};
			var count = 0;

			promise.progress(function() {
				count++;
				assert.equal(count, 1);
				assert.equal(this, obj);
				done();
			});

			dfd.notifyWith(obj);
		});

	});

	describe("the deferred object resolve and reject are one time calls and fail silently if you try to call them more than once", function() {
		it("calling reject after calling resolve does nothing and it stays 'resolved'", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			promise.done(function(){
				assert(true);
			});
			promise.fail(function(){
				assert(false, "fail shouldn't be called after resolved");
			});

			dfd.resolve();
			dfd.reject();

			setTimeout(function() {
				assert.equal(dfd.internalState, 1);
				done();
			}, 10);
		});

		it("calling resolve after calling reject does nothing and it stays 'rejected'", function(done) {
			var dfd = new p();
			var promise = dfd.promise();

			promise.done(function(){
				assert(false, "done shouldn't be called after resolved");
			});
			promise.fail(function(){
				assert(true, "fail should be called after resolved");
			});

			dfd.reject();
			dfd.resolve();

			setTimeout(function() {
				assert.equal(dfd.internalState, 2);
				done();
			}, 10);
		});
	});

	describe("calling when with an array of promises or truthy/falsey things returns a single unified promise that wraps the array. the when can use any existing or new Dfd", function() {
		it("resolves when it is an array of actual promises that all get resolved", function(done) {
			var dfd1 = new p();
			var dfd2 = new p();

			var pro1 = dfd1.promise();
			var pro2 = dfd2.promise();

			var newPro = p.when([pro1, pro2]);

			dfd1.resolve();

			setTimeout(function() {
				assert.equal(newPro.state(), 0);
				dfd2.resolve();
			}, 10);
			
			var count = 0;
			newPro.done(function() {
				count++;

				assert.equal(count, 1);
			});

			newPro.fail(function() {
				asset(false, "fail shouldn't be called when when's pros are all resolved");
			});

			newPro.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});
		});

		it("rejects when it is an array of actual promises that has one rejected", function(done) {
			var dfd1 = new p();
			var dfd2 = new p();

			var pro1 = dfd1.promise();
			var pro2 = dfd2.promise();

			var newPro = p.when([pro1, pro2]);

			dfd1.resolve();

			setTimeout(function() {
				assert.equal(newPro.state(), 0);
				dfd2.reject();
			}, 10);
			
			var count = 0;
			newPro.fail(function() {
				count++;

				assert.equal(count, 1);
			});

			newPro.done(function() {
				asset(false, "done shouldn't be called when when's a pro is rejected");
			});

			newPro.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});
		});

		it("works when when is on a dfd not as a static method", function(done) {
			var dfd1 = new p();
			var dfd2 = new p();

			var pro1 = dfd1.promise();
			var pro2 = dfd2.promise();

			var newPro = dfd1.when([pro1, pro2]);

			dfd1.resolve();

			setTimeout(function() {
				assert.equal(newPro.state(), 0);
				dfd2.resolve();
			}, 10);
			
			var count = 0;
			newPro.done(function() {
				count++;

				assert.equal(count, 1);
			});

			newPro.fail(function() {
				asset(false, "fail shouldn't be called when when's pros are all resolved");
			});

			newPro.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});
		});

		it("works when array is promises and truthies", function(done) {
			var dfd1 = new p();
			var dfd2 = new p();

			var pro1 = dfd1.promise();
			var pro2 = dfd2.promise();

			var newPro = p.when([true, pro1, pro2]);

			dfd1.resolve();

			setTimeout(function() {
				assert.equal(newPro.state(), 0);
				dfd2.resolve();
			}, 10);
			
			var count = 0;
			newPro.done(function() {
				count++;

				assert.equal(count, 1);
			});

			newPro.fail(function() {
				asset(false, "fail shouldn't be called when when's pros are all resolved");
			});

			newPro.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});
		});

		it("works when array is promises and falsies", function(done) {
			var dfd1 = new p();
			var dfd2 = new p();

			var pro1 = dfd1.promise();
			var pro2 = dfd2.promise();

			var newPro = p.when([false, pro1, pro2]);

			dfd1.resolve();

			setTimeout(function() {
				assert.equal(newPro.state(), 0);
				dfd2.resolve();
			}, 10);
			
			var count = 0;
			newPro.fail(function() {
				count++;
				assert.equal(count, 1);
			});

			newPro.done(function() {
				asset(false, "done shouldn't be called when when's array has a falsey");
			});

			newPro.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});
		});

		it("works also when you pass it a bunch of args not an array", function(done) {
			var dfd1 = new p();
			var dfd2 = new p();

			var pro1 = dfd1.promise();
			var pro2 = dfd2.promise();

			var newPro = dfd1.when(true, pro1, pro2);

			dfd1.resolve();

			setTimeout(function() {
				assert.equal(newPro.state(), 0);
				dfd2.resolve();
			}, 10);
			
			var count = 0;
			newPro.done(function() {
				count++;

				assert.equal(count, 1);
			});

			newPro.fail(function() {
				asset(false, "fail shouldn't be called when when's args does not have a falsey");
			});

			newPro.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});
		});

		it("works also when you pass it a bunch of args which are arrays", function(done) {
			var dfd1 = new p();
			var dfd2 = new p();

			var pro1 = [dfd1.promise(), dfd2.promise()];

			var newPro = dfd1.when(true, pro1);

			dfd1.resolve();

			setTimeout(function() {
				assert.equal(newPro.state(), 0);
				dfd2.resolve();
			}, 10);
			
			var count = 0;
			newPro.done(function() {
				count++;

				assert.equal(count, 1);
			});

			newPro.fail(function() {
				asset(false, "fail shouldn't be called when when's args arrays does not have a falsey");
			});

			newPro.always(function() {
				count++;
				assert.equal(count, 2);
				done();
			});
		});
	});
});

describe("Passes the incredibly complicated to read Promises/A+ Tests latest version :D", function () {
	require("promises-aplus-tests").mocha(adapter);
});
