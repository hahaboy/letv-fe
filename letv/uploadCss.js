	/*--
		打包后上传css文件
		-author hahaboy
	*/
	var fs = require('fs'),
		needle = require('needle'),
		upload_conf = require('./upload_conf'),
		requestOptions = upload_conf.requestOptions,
		total = 0, //上传文件总数
		count = 0, //已经上传文件数
		prj,
		uploadCallback,
		uploadFiles,
		log = '', //上传日志信息
		version = [], //css版本信息
		log_file = ''; //日志文件

	function uploadErr(filename, code, msg) {
		console.warn(filename+' 上传错误，错误信息：');
		console.warn(msg || upload_conf.error_msg[code]);
		process.exit(1);
	}

	function uploadEnd() {
		console.log('\n正在检查所有文件是否真的上传成功 ...');
		require('./kit').checkFiles(uploadFiles, function (err) {
			if (err) {
				console.log('有文件未上传成功，禁止上线！');
				uploadCallback && uploadCallback(err);
				return;
			}
			console.log('检查完成，全部文件已上传成功\n');
			log += '\r\n全部文件已上传成功\r\n';
			if (prj==='mcss') {
				var m = 'M站CSS更新方法：复制下面的版本信息（双引号里的部分）去更新公共碎片 m-js-css-v2'+
						'\r\n\r\n"'+version.join(',')+'"\r\n';
				console.log('M站CSS上线请去 ms_min/updated/upload-log.txt 里复制版本信息上线！\n');
			} else {
				m = '';
			}
			var fd = fs.openSync(log_file, 'w', '0666');
			fs.writeSync(fd, m+log, 0, 'utf8');
			fs.closeSync(fd);
			uploadCallback && uploadCallback(err);
		});
	}

	function needleUpload(file, online_dir, filename) {
		//console.log(online_dir, file);
		var buffer = fs.readFileSync(file);
		var data = {
			username: upload_conf.username,
			channel: 'css',
			md5str: upload_conf.md5str,
			//compress: 85,
			//watermark: 0,
			fdir: online_dir,
			single_upload_submit: 'ok',
			single_upload_file: {
				buffer: buffer,
				filename: filename.replace(/\//g, '--'),
				content_type: 'application/octet-stream'
			}
		};

		needle.post(upload_conf.api, data, requestOptions, function (err, resp, body) {
			if (err) {
				uploadErr(filename, 0, '调用接口失败，'+err);
				return; 
			}
			try {
				var json = JSON.parse(body);
			} catch (ex) {
				uploadErr(filename, 0, '上传接口返回内容的格式不是json格式。返回内容：'+body);
				return;
			}
			
			if (json.state!=1) {
				uploadErr(filename, json.state);
				return;
			}
			//http://css.letvcdn.com/lc01_css/201504/07/16/46/mcss/global.css
			var file = json.file;
			console.log(file);
			log += '\r\n上传成功：'+file;
			uploadFiles.push(file);
			//处理成 01_1504/07/16/46:global
			version.push(file.slice(25).replace('css/20', '').replace('/'+
				online_dir+'/', ':').slice(0, -4));

			if (++count>=total) {
				uploadEnd();
			}
		});
	}

	//上传所有文件
	function uploadAllFiles(path, online_dir, subdir) {
		fs.readdirSync(path).forEach(function (filename) {
			var file = path+'/'+filename,
				file_ext = filename.slice(filename.lastIndexOf('.') + 1);
			if (file_ext==='css') {
				total++;
				needleUpload(file, online_dir, subdir+filename);
			} else if (filename[0]!=='.' && fs.statSync(file).isDirectory()) {
				//排除.svn，.github之类的文件夹
				uploadAllFiles(file, online_dir, subdir+filename+'/');
			}
		});
	}

	//用于lekoala、M站的css上传
	exports.upload = function (path, online_dir, callback) {
		prj = online_dir;
		uploadCallback = callback;
		uploadFiles = [];
		console.log('\n开始上传文件');
		log = '';
		var paths = path.split('/').reverse();
		//var path_tag = paths[1]; //文件要上传到什么目录，会处理有子目录的情况
		log_file = paths.slice(2).reverse().join('/')+'/upload-log.txt';
		uploadAllFiles(path.slice(0, -1), online_dir, '');
	};

	//用于主站老css的上传
	exports.upload2 = function (path, online_dir, callback) {
		prj = online_dir;
		uploadCallback = callback;
		uploadFiles = [];
		console.log('\n开始上传文件');
		log = '';
		log_file = path.slice(0, -5)+'upload-log.txt';
		uploadAllFiles(path.slice(0, -1), online_dir, '');
	};
