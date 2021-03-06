'use strict';

var Gauge = require('../gauge');
var fs = require('fs');

var PROCESS_MAX_FDS = 'process_max_fds';

module.exports = function() {
	var isSet = false;
	var fileDescriptorsGauge = new Gauge(PROCESS_MAX_FDS, 'Maximum number of open file descriptors.');

	return function() {
		if(isSet || process.platform !== 'linux') {
			return;
		}

		fs.readFile('/proc/sys/fs/file-max', 'utf8', function(err, maxFds) {
			if(err) {
				return;
			}

			isSet = true;

			fileDescriptorsGauge.set(null, maxFds.replace(/\r?\n$/,''));
		});
	};
};

module.exports.metricNames = [PROCESS_MAX_FDS];
