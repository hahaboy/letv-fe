/*--
	突破本地host请求线上或其他主机资源
	将某个域名指向本地127.0.0.1后，该域名下的所有请求都会指向本地服务器，
	但是本地又可能没有对应的资源，这时候可以用此模块请求线上、或指定主机IP、
	或指定端口的资源。
	-author hahaboy
*/
var fs = require('fs'),
	dns = require('dns'),
	http = require('http'),
	Url = require('url');

function doGet(url, callback) {
	//console.log(url);
	var options = {
		hostname: url.hostname,
		port: url.port || '80',
		path: url.path,
		method: 'GET',
		headers: {
			'Cache-Control': 'max-age=0',
			'Host': (url.port && url.port!='80') ? url.host+':'+url.port : url.host
		}
	};
	//console.log(options);
	var req = http.request(options, function (res) {
		res.setEncoding('utf8');
		var data = '';
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function () {
			callback(false, data);
		});
	});
	req.on('error', function (err) {
		callback(err);
		console.log('get_online_file error: '+err.message);
	});
	req.end();
}

var hostname_cache = {}, exp_time = 0;
//请求非本机内容
//host 请求的域名和端口，例如 'a.com:8080'，'10.58.101.31:80'
//host 可以只有hostname或只有端口号，例如 'a.com'，':8080'
exports.get = function (url, callback, host) {
	url = Url.parse(url);
	//console.log(url);
	if (host) {
		host = host.split(':');
		if (host[0]) {
			url.hostname = host[0];
			host[1] && (url.port = host[1]);
			doGet(url, callback);
			return;
		}
		url.port = host[1];
	}
	if (exp_time<Date.now()) {
		hostname_cache = {}; //清空缓存
		exp_time = Date.now() + 180000; //hostname缓存3分钟（180000ms）
	}
	var hostname = url.hostname;
	if (hostname_cache.hasOwnProperty(hostname)) {
		url.hostname = hostname_cache[hostname];
		doGet(url, callback);
		return;
	}
	dns.resolve4(hostname, function (err, addresses) {
		if (err) {
			callback(err);
			console.log('get_online_file error: '+err.message);
		} else {
			url.hostname = hostname_cache[hostname] = addresses[0];
			doGet(url, callback);
		}
	});
};
