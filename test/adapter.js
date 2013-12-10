var p = require('../promise.js');

module.exports = function () {

	return {
		resolved: function(value) {
			var dfd = new p.Dfd();
			dfd.resolve(value);
			return dfd.promise();
		},
		rejected: function(reason) {
			var dfd = new p.Dfd();
			dfd.reject(reason);
			return dfd.promise();
		},
		deferred: function() {
			var dfd = new p.Dfd();
			var ret = {
				promise: dfd.promise(),
				resolve: dfd.resolve.bind(dfd),
				reject: dfd.reject.bind(dfd)
			}
			return ret;
		}
	}

}();