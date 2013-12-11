var assert = require("assert");
var p = require("../promise.js");

var benchmarks = {
	"./adapter.js": {},
	"./benchmarks/qAdapter.js": {}
};

var jPromiseKey = "./adapter.js";


var iterations = 10000;

function benchmark(adapter) {
	var dummy = {dummy:"dummy"};
	var resCounter = 1;
	var rejCounter = 1;
	var deferred = adapter.deferred();
	var resolvedDfd = adapter.deferred();
	var start, stop;

	var ret = {
		ops: 0,
		resolvedOps: 0,
		rejectedOps: 0
	};

	start = new Date().getTime();
	for(var i = 0; i < iterations; i++) {
		var pro = adapter.resolved(dummy).then(function() {
			resCounter++;
			if(resCounter === iterations) {
				stop = new Date().getTime();
				ret.resolvedOps = iterations / (stop - start) * 1000;
				resolvedDfd.resolve(true);
			}
		});
	}

	resolvedDfd.promise.then(function() {
		start = new Date().getTime();
		for(var i = 0; i < iterations; i++) {
			var pro = adapter.rejected(dummy).then(undefined, function() {
				rejCounter++;
				if(rejCounter === iterations) {
					stop = new Date().getTime();

					ret.rejectedOps = iterations / (stop - start) * 1000;

					// Average out the resolved and rejects to get the total ops/sec
					ret.ops = (ret.resolvedOps + ret.rejectedOps) / 2;
					deferred.resolve(ret);
				}
			});
		}
	});

	return deferred.promise;
}

var xhrs = [];
for(var key in benchmarks) {
	(function(key) {
		var adapter = require(key);

		var xhr = benchmark(adapter).then(function(ops) {
			benchmarks[key].opts = ops;
		});

		xhrs.push(p.wrap(xhr));
	})(key);
}

describe("We want to test our speed against Q", function() {
	describe("We're faster than everyone else", function() {
		it("Round 1: indeed, numbers don't lie...", function(done){
			this.timeout(Object.keys(benchmarks).length * 10000);
			p.when(xhrs).done(function(){
				for(var key in benchmarks) {
					if(key !== jPromiseKey) {
						assert((benchmarks[jPromiseKey].ops > benchmarks[key].ops), "Dammit, " + key + " was faster");
					}
				}
				done();
			});
		});
	});
});
