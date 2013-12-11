var assert = require("assert");

var pBench = require('./benchmarks/jpromise.js');
var qBench = require('./benchmarks/q.js');

describe("We're faster than Q", function() {
	it("Round 1: indeed, numbers don't lie... P.S. ask about how compliant Q is on the promise specs", function(done){
		this.timeout(10000);
		pBench().then(function(pData) {
			qBench().then(function(qData) {
				assert((pData.ops > qData.ops), "Dammit Q was faster");
				done();
			});
		}, undefined);
	});
});

