'use strict';

var Gauge = require('../gauge');
var fs = require('fs');

var  PROCESS_RESIDENT_MEMORY_BYTES = 'process_resident_memory_bytes';
var  PROCESS_VIRTUAL_MEMORY_BYTES = 'process_virtual_memory_bytes';

var  NODEJS_MEMORY_RSS_BYTES = 'nodejs_memory_rss_bytes';
var  NODEJS_MEMORY_HEAP_TOTAL_BYTES = 'nodejs_memory_heap_total_bytes';
var  NODEJS_MEMORY_HEAP_USED_BYTES = 'nodejs_memory_heap_used_bytes';

module.exports = function() {
	var v8RSSGauge = new Gauge(NODEJS_MEMORY_RSS_BYTES, 'V8 resident set size in bytes');
	var v8HeapTotalGauge = new Gauge(NODEJS_MEMORY_HEAP_TOTAL_BYTES, 'the V8 heap total in bytes');
	var v8HeapUsedGauge = new Gauge(NODEJS_MEMORY_HEAP_USED_BYTES, 'the V8 heap used in bytes');

	var residentMemGauge = new Gauge(PROCESS_RESIDENT_MEMORY_BYTES, 'Resident memory size in bytes.');
	var virtualMemGauge = new Gauge(PROCESS_VIRTUAL_MEMORY_BYTES, 'Virtual memory size in bytes.');

	return function() {
		var memoryUsage = process.memoryUsage();

		v8RSSGauge.set(memoryUsage.rss);
		v8HeapTotalGauge.set(memoryUsage.heapTotal);
		v8HeapUsedGauge.set(memoryUsage.heapUsed);

		if(process.platform === 'linux') {
			fs.readFile('/proc/self/status', 'utf8', function(err, status) {
				if(err) {
					return;
				}
				var structuredOutput = structureOutput(status);

				residentMemGauge.set(null, structuredOutput.VmRSS);
				virtualMemGauge.set(null, structuredOutput.VmSize);
			});
		};
	};
};

module.exports.metricNames = [
	PROCESS_RESIDENT_MEMORY_BYTES,
	PROCESS_VIRTUAL_MEMORY_BYTES,
	NODEJS_MEMORY_RSS_BYTES,
	NODEJS_MEMORY_HEAP_TOTAL_BYTES,
	NODEJS_MEMORY_HEAP_USED_BYTES
];

// Linux specific metrics
var values = ['VmSize', 'VmRSS', 'VmData'];

function structureOutput(input) {
	var returnValue = {};

	input.split('\n')
		.filter(function(s) {
			return values.some(function(value){
				return s.indexOf(value) === 0;
			});
		})
		.forEach(function(string) {
			var split = string.split(':');

			// Get the value
			var value = split[1].trim();
			// Remove trailing ` kb`
			value = value.substr(0, value.length - 3);
			// Make it into a number in bytes bytes
			value = Number(value) * 1000;

			returnValue[split[0]] = value;
		});

	return returnValue;
}
