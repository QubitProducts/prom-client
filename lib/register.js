'use strict';

var metrics = {};
var enabled = !process.env.DISABLE_PROM_CLIENT;

function getMetricsAsArray() {
	return Object.keys(metrics)
		.map(function(key) {
			return metrics[key];
		});
}

var getMetrics = function getMetrics() {
	return getMetricsAsArray().reduce(function(acc, metric) {
		var item = metric.get();
		var name = escapeString(item.name);
		var help = escapeString(item.help);
		help = ['#', 'HELP', name, help].join(' ');
		var type = ['#', 'TYPE', name, item.type].join(' ');

		var values = (item.values || []).reduce(function(valAcc, val) {
			var labels = Object.keys(val.labels || {}).map(function(key) {
				return key + '="' + escapeLabelValue(val.labels[key]) + '"';
			});

			var metricName = val.metricName || item.name;
			if(labels.length) {
				metricName += '{' + labels.join(',') + '}';
			}

			valAcc += [metricName, val.value].join(' ');
			valAcc += '\n';
			return valAcc;
		}, '');

		acc += [help, type, values].join('\n');
		return acc;
	}, '');
};

function escapeString(str) {
	return str.replace(/\n/g, '\\n').replace(/\\(?!n)/g, '\\\\');
}
function escapeLabelValue(str) {
	if(typeof str !== 'string') {
		return str;
	}
	return escapeString(str).replace(/"/g, '\\"');
}

function compareMetric(dst, src){
	if(dst.name !== src.name) {
		return false;
	}

	var srcLabels = src.labelNames || [];
	var dstLabels = dst.labelNames || [];
	var equalSrc = function(value, index){
		return value !== srcLabels[index];
	};

	if(dstLabels.length !== srcLabels.length ||
		dstLabels.length !== 0 && dstLabels.every(equalSrc)) {
		return false;
	}

	return true;
}

var registerMetric = function registerMetric(metricFn) {
	if(!isEnabled()) {
		return;
	}

	if(metrics[metricFn.name] && !compareMetric(metrics[metricFn.name], metricFn)) {
		throw new Error('A metric with the name ' + metricFn.name + ' has already been registered.');
	}

	metrics[metricFn.name] = metricFn;
};

var clearMetrics = function clearMetrics() {
	metrics = {};
};

var getMetricsAsJSON = function getMetricsAsJSON() {
	return getMetricsAsArray().map(function(metric) {
		return metric.get();
	});
};

var removeSingleMetric = function removeSingleMetric(name) {
	delete metrics[name];
};

var isEnabled = function isDisabled() {
	return enabled;
};

var enable = function enable() {
	enabled = true;
};

var disable = function disable() {
	enabled = false;
	clearMetrics();
};

module.exports = {
	registerMetric: registerMetric,
	metrics: getMetrics,
	clear: clearMetrics,
	getMetricsAsJSON: getMetricsAsJSON,
	removeSingleMetric: removeSingleMetric,
	isEnabled: isEnabled,
	enable: enable,
	disable: disable
};
