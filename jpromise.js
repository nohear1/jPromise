/**
 * Promise.js returns a Deferred object which supports the jQuery deferred api but without
 *        the requirement on jQuery.  Its also more performant than jQuery deferred and when JS, 
 *        a bit less performant than vow.js but it does the difference between the deferred object and the 
 *        promise object better, (whereas vow does not).
 * @closure returns a Deferred @constructor
 * @notes Read this if you don't understand public/private/privilege in JS
 *        http://javascript.crockford.com/private.html
 *        there is a cost to defining all of these functions in the constructor... 
 *        but that cost in very few instances is merited by the encapsulation gains
 * @returns {p} Deferred constructor
**/
(function(root, factory) {
	if(typeof define === 'function' && define.amd) {
		define(factory);
	} else if(typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.p = factory();
	}
})(this, function() {

	function extend(a, b) {
		for(var key in b) {
			a[key] = b[key];
		}
	}

	function isFunction(a) {
		return !!(a && Object.prototype.toString.call(a) === '[object Function]');
	}

	function isObject(a) {
		return !!(a && Object.prototype.toString.call(a) === '[object Object]');
	}

	function isArray(a) {
		return !!(a && Object.prototype.toString.call(a) === '[object Array]');
	}

	function isPromise(promise) {
		if(typeof promise !== "undefined" && promise !== null && promise.toString && promise.toString() === "[object Promise]") {
			return true;
		}
		return false;
	}

	function isDeferred(deferred) {
		if(typeof deferred !== "undefined" && deferred !== null && deferred.toString && deferred.toString() === "[object Deferred]") {
			return true;
		}
		return false;
	}

	var setTimeout = root.setTimeout;

	if(process && isFunction(process.nextTick)) {
		setTimeout = process.nextTick;
	}

	/**
	 * callback receives a scope and data as well as a list of callbacks to execute
	 *         it proceeds to call all of those callbacks with the scope and data provided
	 * @function
	 * @private to this closure
	 * @param {object} scope - the scope with which to call the callback
	 * @param {object} data - data to pass as the argument of the callback
	 * @param {Array.<Function>} cbs - an array of callback functions
	 * @return {Function} Function to invoke the set of callbacks provided
	**/
	function callback(scope, data, cbs) {
		setTimeout(function() {
			cbs.forEach(function(item) {
				item.call(scope, data);
			});
		}, 0);
	}

	/**
	 * sanitizeCbs ensures that the callbacks are returns in an array format
	 *         this is a helper function to keep it from being used all over the place below
	 * @function
	 * @private to this closure
	 * @param {Array.<Function>|Function} cbs either an array of functions or a single function
	 * @return {Array.<Function>} - returns an array of functions
	**/
	function sanitizeCbs(cbs) {
		if(cbs && !isArray(cbs)) {
			cbs = [cbs];
		}
		return cbs;
	}

	var internalFilteredDataInstance = {mine:"mine"};
	var filteredData = internalFilteredDataInstance;
	function getThenFilterCallback(filter, newp, what) {
		return function(data) {
			filteredData = internalFilteredDataInstance;
			if(filter && isFunction(filter)) {
				try {
					filteredData = filter.call(undefined, data);
				} catch(e) {
					filteredData = internalFilteredDataInstance;
					newp.reject(e);
				}
				if(filteredData !== internalFilteredDataInstance) {
					if(what === "reject") {
						newp.resolve(filteredData);
					} else {
						newp[what](filteredData);
					}
				}
			} else {
				newp[what](data);
			}
		};
	}

	function doIsPromiseSteal(data, scope) {
		data.done(function(resData) {
			scope.doResolve(resData);
		});
		data.fail(function(rejData) {
			scope.doReject(rejData);
		});
		data.progress(function(progData) {
			scope.doNotify(progData);
		});
	}

	function doWhatYouShould(data, what, scope) {
		switch(what) {
			case "resolve":
				scope.doResolve(data);
			break;

			case "reject": 
				scope.doReject(data);
			break;

			case "notify":
				scope.doNotify(data);
			break;
		}
	}

	function doTryAndGetDatasThen(data, scope) {
		var ret = {
			failed: false,
			datasThen: undefined
		};

		try {
			ret.datasThen = data.then;
		} catch(e) {
			ret.datasThen = undefined;
			ret.failed = true;
			scope.doReject(e);
		}

		return ret;
	}

	function doDatasThenIsAFunction(datasThen, data, scope) {
		var fCalled = false;
		try {
			var datasThenp = new p();

			datasThenp.done(function(resData) {
				scope.doResolve(resData);
			}).fail(function(rejData) {
				scope.doReject(rejData);
			}).progress(function(progData) {
				scope.doProgress(progData);
			});

			datasThen.call(data, function(resData) {
				if(!fCalled) {
					fCalled = true;
					datasThenp.resolve(resData);
				}
			}, function(rejData) {
				if(!fCalled) {
					fCalled = true;

					datasThenp.reject(rejData);
				}
			}, function(progData) {
				datasThenp.notify(progData);
			});
		} catch(e) {
			if(!fCalled) {
				scope.doReject(e);
			}
		}
	}

	function doStealDatasThen(data, what, scope) {
		var ret = doTryAndGetDatasThen(data, scope);

		if(!ret.failed) {
			if(isFunction(ret.datasThen)) {
				doDatasThenIsAFunction(ret.datasThen, data, scope);
			} else {
				doWhatYouShould(data, what, scope);
			}
		}
	}

	/**
	 * Represents a Deferred Object
	 * @constructor
	 * @param {function} [beforeStart] - an optional function to be called before
	 *                               the deferred starts up
	 * @param {boolean} [debugMode] - Enables debug mode for exposing internal properties
	 * @returns {deferred} the deferred instance object
	**/
	var p = function(beforeStart) {
		//setup some instance parameters
		//internalState 0 == pending, 1 == resolved, 2 == rejected
		this.internalState = 0;
		this.internalWith = undefined;
		this.internalData = null;
		this.callbacks = {
			done    : [],
			fail    : [],
			always  : [],
			progress: []
		};
		this._pro = null;
		
		//if beforeStart is passed then call it with this being the deferred
		if(beforeStart && isFunction(beforeStart)) {
			beforeStart.call(this, this);
		}

		return this;
	};

	var Promise = function(p, target) {
		this.done = p.done.bind(p);
		this.fail = p.fail.bind(p);
		this.progress = p.progress.bind(p);
		this.always = p.always.bind(p);
		this.then = p.then.bind(p);
		
		this.state = function() {
			return p.internalState;
		};

		//if target was passed in then return the ='promisified' target 
		//intead of a new promise object
		if(target && isObject(target)) {
			extend(target, this);
			return target;
		}
		return this;
	}
	extend(Promise.prototype,  {
		toString: function() {
			return "[object Promise]";
		}
	});

	//extend the Deferred prototype with the functions that it needs.
	//This is a performance/security trade-off in that these functions are
	//kinda exposed (even though we freeze them below), but they are on
	//the prototype chain so tht you could extend this object and add things
	//or overload some prototype methods
	extend(p.prototype, {
		toString: function() {
			return "[object Deferred]";
		},

		/**
		 * Represents a Promise Object.  If target is supplied and is an object
		 *         then we will turn that target object into the promise 
		 *         by extending it with the promise functions
		 *         instead of creating a new promise
		 * @constructor
		 * @param {p} p - the linked Deferred instance
		 * @param {object} target - the target object
		 * @returns {promise} the promise instance object
		**/
		Promise: Promise,

		/**
		 * notify will call any progress callbacks with the data provided
		 * @function
		 * @public on prototype
		 * @param {object} data - the data to notify with 
		 * @return {null} null
		**/
		notify: function(data) {
			if(this.internalState === 0) {
				this.internalData = data;
				callback(
					this.internalWith, 
					this.internalData, 
					this.callbacks.progress
				);
			}
			return this;
		},
		
		/**
		 * notifyWith will call any progress callbacks with the data provided 
		 *         using the scope provided
		 * @function
		 * @public on prototype
		 * @param {object} scope - the scope to call the progress callbacks with
		 * @param {object} data - the data to notify with 
		 * @return {null} null
		**/
		notifyWith: function(scope, data) {
			if(this.internalState === 0) {
				this.internalWith = scope;
				this.internalData = data;
				callback(
					this.internalWith, 
					this.internalData, 
					this.callbacks.progress
				);
			}
			return this;
		},
		
		doNotify: function(data) {
			this.internalData = data;
			callback(
				this.internalWith, 
				this.internalData, 
				this.callbacks.progress
			);
		},

		/**
		 * reject will call any fail callbacks with the data provided, as well as always callbacks
		 * @function
		 * @public on prototype
		 * @param {object} [data] - the data to reject with
		 * @return {null} null
		**/
		reject: function(data) {
			if(this.internalState === 0) {
				this.deNestSanitizeTheInsanityAndCall(data, "reject");
			}
			return this;
		},
		
		/**
		 * rejectWith will call any fail and always callbacks with the data provided 
		 *         using the scope provided
		 * @function
		 * @public on prototype
		 * @param {object} scope - the scope to call the callbacks with
		 * @param {object} data - the data to reject with 
		 * @return {null} null
		**/
		rejectWith: function(scope, data) {
			if(this.internalState === 0) {
				this.internalWith = scope;
				this.deNestSanitizeTheInsanityAndCall(data, "reject");
			}
			return this;
		},

		doReject: function(data) {
			this.internalData = data;
			this.internalState = 2;
			callback(
				this.internalWith, 
				this.internalData, 
				this.callbacks.fail.concat(this.callbacks.always)
			);
		},
		
		/**
		 * resolve will call any done and always callbacks with the data provided
		 * @function
		 * @public on prototype
		 * @param {object} data - the data to resolve with 
		 * @return {null} null
		**/
		resolve: function(data) {
			if(this.internalState === 0) {
				this.deNestSanitizeTheInsanityAndCall(data, "resolve");
			}
			return this;
		},
		
		/**
		 * resolveWith will call any done and always callbacks with the data provided
		 *         using the scope provided
		 * @function
		 * @public on prototype
		 * @param {object} scope - the scope to call the callbacks with
		 * @param {object} data - the data to notify with 
		 * @return {null} null
		**/
		resolveWith: function(scope, data) {
			if(this.internalState === 0) {
				this.internalWith = scope;
				this.deNestSanitizeTheInsanityAndCall(data, "resolve");
			}
			return this;
		},

		doResolve: function(data) {
			this.internalData = data;
			this.internalState = 1;
			callback(
				this.internalWith, 
				this.internalData, 
				this.callbacks.done.concat(this.callbacks.always)
			);
		},

		/**
		 * always will set a callback for the resolve and reject events
		 *         or will immediately run the callback if the object is already
		 *         resolved or rejected.
		 * @function
		 * @public on prototype
		 * @param {function || array[function]} cbs - a callback function or an array
		 *                     of callback functions
		 * @return {null} null
		**/
		always: function(cbs) {
			cbs = sanitizeCbs(cbs);
			if(cbs.length > 0) {
				if(this.internalState !== 0) {
					callback(
						this.internalWith, 
						this.internalData, 
						cbs
					);
				} else {
					this.callbacks.always = this.callbacks.always.concat(cbs);
				}
			}
			return this.promise();
		},
		
		/**
		 * done will set a callback for the resolve events
		 *         or will immediately run the callback if the object is already
		 *         resolved.
		 * @function
		 * @public on prototype
		 * @param {Function|Array.<Function>} cbs a callback function or an array
		 *                     of callback functions
		 * @return {null} null
		**/
		done: function(cbs) {
			cbs = sanitizeCbs(cbs);
			if(cbs.length > 0) {
				if(this.internalState === 1) {
					callback(
						this.internalWith, 
						this.internalData, 
						cbs
					);
				} else {
					this.callbacks.done = this.callbacks.done.concat(cbs);
				}
			}
			return this.promise();
		},
		
		/**
		 * fail will set a callback for the reject events
		 *         or will immediately run the callback if the object is already
		 *         rejected.
		 * @function
		 * @public on prototype
		 * @param {Function|Array.<Function>} cbs - a callback function or an array
		 *                     of callback functions
		 * @return {null} null
		**/
		fail: function(cbs) {
			cbs = sanitizeCbs(cbs);
			if(cbs.length > 0) {
				if(this.internalState === 2) {
					callback(
						this.internalWith, 
						this.internalData, 
						cbs
					);
				} else {
					this.callbacks.fail = this.callbacks.fail.concat(cbs);
				}
			}
			return this.promise();
		},
		
		/**
		 * progress will set a callback for the notify events, or do nothing
		 *         if it is already resolved or rejected
		 * @function
		 * @public on prototype
		 * @param {function || array[function]} cbs - a callback function or an array
		 *                     of callback functions
		 * @return {null} null
		**/
		progress: function(cbs) {
			if(this.internalState === 0) {
				cbs = sanitizeCbs(cbs);
				this.callbacks.progress = this.callbacks.progress.concat(cbs);
			}
			return this.promise();
		},

		deNestSanitizeTheInsanityAndCall: function(data, what) {
			if(data === this.promise()) {
				this.doReject(new TypeError("Promise Tried to Resolve with Self"));
			} else if(isPromise(data)) {
				doIsPromiseSteal(data, this);
			} else if(isObject(data) || isFunction(data)) {
				doStealDatasThen(data, what, this);
			} else {
				doWhatYouShould(data, what, this);
			}
		},

		/**
		 * then provides a function which allows chaining of promise callbacks essentially
		 *         it allows you to provide filter functions that will be called upon the original promise
		 *         which may modify/alter the data before returning/resolving/rejecting the newly
		 *         created deferred/promise.
		 * @function
		 * @public on prototype
		 * @param {function} doneFilter - a function to be run on the resolve event and whose return value
		 *                              will be used to resolve the promise returned by the "then"
		 * @param {function} failFilter - a function to be run on the reject event and whose return value
		 *                              will be used to reject the promise returned by the "then"
		 * @param {function} progressFilter - a function to be run on the notify event and whose return value
		 *                              will be used to notify the promise returned by the "then"
		 * @return {Promise} New promise to chain further events off of
		**/

		then: function(doneFilter, failFilter, progressFilter) {
			var newp = new p();

			this.done(
				getThenFilterCallback(doneFilter, newp, "resolve")
			).fail(
				getThenFilterCallback(failFilter, newp, "reject")
			).progress(
				getThenFilterCallback(progressFilter, newp, "notify")
			);

			return newp.promise();
		},

		/**
		 * Wrap takes a thenable and returns a jPromise.
		 *
		 * @thenable A thenable object (an object/function that has a then function on it)
		 *
		 * @return promisified then
		**/
		wrap: function(thennable) {
			var newp = new p();

			var datasThen;
			if(isPromise(thennable) || isDeferred(thennable)) {
				doIsPromiseSteal(thennable, newp);
			} else if (isObject(thennable) || isFunction(thennable)) {
				doStealDatasThen(thennable, "resolve", newp);
			} else {
				newp.resolve(thennable);
			}

			return newp.promise();
		},

		/**
		 * When can take an array of promised or truthy/falsey objects
		 *         and can mesh them into a single promise/deferred which will
		 *         be resolved when all of the passed in promises resolve, or rejected if
		 *         any of the passed in promises is rejected.  It returns a promise in 
		 *         its own right which can represent the summation of all the inner
		 *         promises.
		 * @function
		 * @public on prototype
		 * @return {promise} promise instance object
		**/
		when: function() {
			var args = Array.prototype.slice.call(arguments);
			var promises = [];
			var newp = new p();
			var resolvedCount = 0;
			var handledCount = 0;
			var whenData = [];
			
			args.forEach(function(item) {
				if (isArray(item)) {
					promises = promises.concat(item);
				} else {
					promises.push(item);
				}
			});

			if(promises.length === 0) {
				newp.resolve(whenData);
			}

			promises.forEach(function(promise, i) {
				if(isPromise(promise) || isDeferred(promise)) {
					promise.done(function(data) {
						resolvedCount++; handledCount++;
						whenData[i] = data;
						newp.notify({
							index: i, action: "resolved", data: data, resolved: resolvedCount, handled: handledCount
						});

						if(resolvedCount === promises.length) {
							newp.resolve(whenData);
						} else if (handledCount === promises.length) {
							newp.reject(whenData);
						}
					}).fail(function(data) {
						handledCount++;
						whenData[i] = data;
						newp.notify({
							index: i, action: "rejected", data: data, resolved: resolvedCount, handled: handledCount
						});

						if(resolvedCount === promises.length) {
							newp.resolve(whenData);
						} else if (handledCount === promises.length) {
							newp.reject(whenData);
						}
					}).progress(function(data) {
						newp.notify(data);
					});
				} else if (!!promise) {
					resolvedCount++; handledCount++;
					whenData[i] = promise;
				} else {
					handledCount++;
					whenData[i] = promise;
				}
			});

			// if all of the "promises" were not actually promises but rather truthy or falsey objects
			// then we can determine the state right now syncrounously after the for loop
			// instead of waiting for inner promise callbacks etc
			if(resolvedCount === promises.length) {
				newp.resolve(whenData);
			} else if (handledCount === promises.length) {
				newp.reject(whenData);
			}
			return newp.promise();
		},
		
		/**
		 * getter for the p's promise
		 *         The promise is the only thing which should be passed
		 *         to untrusted other functions, and is all that is needed
		 *         to setup callbacks on notify/resolve/reject events.
		 *         The promise cannot be used to "escalate" to the deferred
		 * @function
		 * @public on prototype
		 * @return {Promise} promise instance object
		**/
		promise: function(target) {
			if(!this._pro) {
				// Create this here since the creator of the deferred object doesn't always
				// ask for a promise. This gives a slight performance benefit if the creator
				// keeps it close to chest.
				this._pro = new this.Promise(this, target);
			}
			return this._pro;
		},

		state: function() {
			return this.internalState;
		}
	});

	p.when = p.prototype.when;
	p.wrap = p.prototype.wrap;

	if(Object.freeze) {
		Object.freeze(p.prototype);
	}
	
	//and also return the Constructor so that it could be saved and used directly
	return p;
});
