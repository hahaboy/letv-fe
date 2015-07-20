/*--
	打包后上传js文件
	-author hahaboy
*/
var fs = require('fs'),
	needle = require('needle'),
	upload_conf = require('./upload_conf'),
	requestOptions = upload_conf.requestOptions;

var postData = {
	username: upload_conf.username,
	channel: 'js',
	md5str: upload_conf.md5str,
	//compress: 85,
	//watermark: 0,
	//fdir: prj,
	//single_upload_file: {
	//	buffer: fs.readFileSync(file),
	//	filename: filename,
	//	content_type: 'application/octet-stream'
	//},
	single_upload_submit: 'ok'
};

function needleUpload(file, filename, callback) {
	//console.log(file);
	postData.single_upload_file = {
		buffer: fs.readFileSync(file),
		filename: filename,
		content_type: 'application/octet-stream'
	};
	needle.post(upload_conf.api, postData, requestOptions, function (err, resp, body) {
		//console.log(body);
		if (err) {
			callback(err);
			return;
		}
		try {
			var json = JSON.parse(body);
		} catch (ex) {
			callback('上传接口返回内容的格式不是json格式。返回内容：'+body);
			return;
		}
		if (json.state==1) {
			callback(false, json.file);
		} else {
			callback(upload_conf.error_msg[json.state]+'。返回内容：'+body);
		}
	});
}

//上传多文件
exports.upload = function (project, path, files, callback) {
	postData.fdir = project;
	var data = {};
	var i = 0, len = files.length, filename;
	var put = function () {
		if (i<len) {
			filename = files[i];
			needleUpload(path+filename, filename, function (err, fileurl) {
				if (err) {
					postData.single_upload_file = null;
					callback(filename+' 上传错误：'+err);
				} else {
					console.log('=== 上传完成：'+fileurl+' 　- '+(len - i));
					data[filename] = fileurl;
					i++;
					put();
				}
			});
		} else {
			postData.single_upload_file = null;
			callback(false, data);
		}
	};
	put();
};

//上传单文件
exports.uploadOneFile = function (project, file, filename, callback) {
	//console.log(file, filename);
	postData.fdir = project;
	needleUpload(file, filename, function (err, fileurl) {
		postData.single_upload_file = null;
		if (err) {
			callback(filename+' 上传错误：'+err);
		} else {
			callback(false, fileurl);
		}
	});
};
