jPromise
==========

A Promise Library that is actually spec compliant with the latest versions of the spec...

## A library conforming to the Promise/A spec.
Tested in Chrome, Firefox, Safari, and IE8/9/10.

This is a promise library that is speedy quick, doesn't hold onto scopes everywhere all willy-nilly, and is also quite flexible.

* `p` Constructor
	* Creates a new deferred object
* `dfd.promise()`
	* Returns the promise for a given deferred object. The promise object is not able to access some of the deferrer's methods, such as resolve and reject.
* `dfd.resolve(arg)`
	* Resolves the deferred object. When the deferred object gets resolved, callbacks on `dfd.then`, `dfd.done`, and `dfd.always` will get called with `arg`.
* `dfd.reject(arg)`
	* Rejects the deferred object. When the deferred object gets resolved, callbacks on `dfd.then`, `dfd.fail`, and `dfd.always` will get called with `arg`.
* `dfd.progress(arg)`
	* Progresses the deferred object (like a resolve but can be called multiple times). When the deferred object gets resolved, callbacks on `dfd.notify` will get called with `arg`.
* `dfd.done(cb)` and `promise.done(cb)`
	* Creates a callback for when the deferred object gets resolved. The cb function will get called with the `arg` that the deferred object was resolved with.
* `dfd.fail(cb)` and `promise.fail(cb)`
	* Creates a callback for when the deferred object gets rejected. The cb function will get called with the `arg` that the deferred object was rejected with.
* `dfd.progress(cb)` and `promise.progress(cb)`
	* Creates a callback for when the deferred object gets notified. The cb function will get called with the `arg` that the deferred object was notified with.

### Example:
```
//Stashes on the global _ on the property Dfd...
//The closure also returns the Dfd constructor and could be munged to work in AMD/Common if we gave a...
var p = require('jpromise');

var dfd = new p();

var pro = dfd.promise();

pro.always(function(data) {
  console.log("always", data);
});

pro.done(function(data) {
  console.log("done", data);
});

pro.fail(function(data) {
  console.log("fail", data);
});

pro.progress(function(data) {
  console.log("progress", data);
});

setTimeout(function() {
  dfd.notify("foo");

  console.log("state", dfd.state());

  dfd.resolve("bar");

  pro.done(function(data) {
    console.log("after Done", data);
  });

  console.log("state", dfd.state());

}, 500);

//returns in console:
// progress "foo"
// state 0
// always "bar"
// done "bar"
// after Done "bar"
// state 1

```

### Notes
* You can done/fail/progress/then on the dfd as well as the promise, but you can only resolve/reject/notify on the dfd
* You cannot escalate the promise into the dfd, it is a one way street
* You can get the promise from the dfd multiple times and it will always return the same promise instance
* You can bind at any point even after a dfd has resolved/rejected and it will instantly return
* This sucker is about 3x as fast/efficient as jQuery's Deferred piece clocking in at about 100k ops a second
