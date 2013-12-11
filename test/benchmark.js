var assert = require("assert");

var pBench = require('./benchmarks/jpromise.js');
var qBench = require('./benchmarks/q.js');

var promisesAplusTests = require("promises-aplus-tests");

var pAdapter = require("./adapter.js");
var qAdapter = require("./benchmarks/qAdapter.js");

var pPass = false;
var qPass = false;

describe("We want to test our speed against Q", function() {
	it("Should Only happen if We are 100% spec compliant", function(done) {
		this.timeout(20000);
		promisesAplusTests(pAdapter, function (err) {
			if(err === null) {
				assert(true)
				pPass = true
			} else {
				assert(false, "We didn't pass some tests")
			}
			done();
		});
	});

	it("Should Only happen if Q are 100% spec compliant", function(done) {
		this.timeout(20000);
		promisesAplusTests(qAdapter, function (err) {	
			//BULLSHIT YOU LIAR ... YOU DIE IMMEDIATELY AND CALLING the spec via the CLI you DIE 
			//AND HANG NOT EVEN A QUARTER OF THE WAY THROUGH

			if(err === null) {
				assert(true)
				qPass = true
			} else {
				assert(false, "Q didn't pass some tests")
			}
			done();
		});
	});
});

if(pPass && qPass) {
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
}

