var p = require("../jpromise.min.js");

var assert = require("assert");

var pBench = require('./benchmarks/jpromise.js');
var qBench = require('./benchmarks/q.js');

describe("We're faster than Q, numbers don't lie... P.S. ask about how compliant Q is on the promise specs", function() {
	it("Round 1", function(done){
		this.timeout(10000);
		pBench().done(function(pData) {
			qBench().done(function(qData) {
				assert((pData.ops > qData.ops), "Dammit Q was faster by: " + (qData.ops - pData.ops));
				done();
			});
		}, undefined);
	});

	it("Round 2", function(done){
		this.timeout(10000);
		pBench().done(function(pData) {
			qBench().done(function(qData) {
				assert((pData.ops > qData.ops), "Dammit Q was faster by: " + (qData.ops - pData.ops));
				done();
			});
		}, undefined);
	});

	it("Round 3", function(done){
		this.timeout(10000);
		pBench().done(function(pData) {
			qBench().done(function(qData) {
				assert((pData.ops > qData.ops), "Dammit Q was faster by: " + (qData.ops - pData.ops));
				done();
			});
		}, undefined);
	});

	it("Round 4", function(done){
		this.timeout(10000);
		qBench().done(function(qData) {
			pBench().done(function(pData) {
				assert((pData.ops > qData.ops), "Dammit Q was faster by: " + (qData.ops - pData.ops));
				done();
			});
		}, undefined);
	});

	it("Round 5", function(done){
		this.timeout(10000);
		qBench().done(function(qData) {
			pBench().done(function(pData) {
				assert((pData.ops > qData.ops), "Dammit Q was faster by: " + (qData.ops - pData.ops));
				done();
			});
		}, undefined);
	});

	it("Round 6", function(done){
		this.timeout(10000);
		qBench().done(function(qData) {
			pBench().done(function(pData) {
				assert((pData.ops > qData.ops), "Dammit Q was faster by: " + (qData.ops - pData.ops));
				done();
			});
		}, undefined);
	});
});

