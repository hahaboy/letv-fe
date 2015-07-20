/*--
	构建JS项目（合并压缩）
*/
var fs = require('fs'),
	sfs,
	child_process = require('child_process'),
	crypto = require('crypto'),
	util = require('./lib/util'),
	trace = require('./lib/trace'),
	kit = require('./kit'),
	combine, // = require('./combine'),
	uploader = require('./upload_file'),
	reg_data_key = /\/\*{{([\D\d]+?)}}\*\//g,
	ver_js = '_version.js';

var prj,
	prj_conf,
	prj_path,
	build_path,
	path_main,
	path_min,
	path_updated,
	path_tag, //待上线的tag版本，放在updated文件夹下。is_release=true并且boot_inc不存在时才创建
	build_data,
	charset,
	compress_cmd,
	is_release,
	tester_id,

	versions,
	new_vers, //新的版本
	main_files,
	updated_list, //有更新的文件列表，包括新加的文件
	start_time, //开始时间
	err_log;

//创建构建目录
function mkdir() {
	fs.existsSync(build_path) || fs.mkdirSync(build_path);
	fs.existsSync(path_main) || fs.mkdirSync(path_main);
	fs.existsSync(path_min) ? util.cleardir(path_min) : fs.mkdirSync(path_min);
	fs.existsSync(path_updated) || fs.mkdirSync(path_updated);
	if (path_tag) {	
		fs.existsSync(path_tag) ? util.cleardir(path_tag) : fs.mkdirSync(path_tag);
	}
}
//解析版本文件
function getVersions() {
	if (!prj_conf.boot_inc) {
		trace.warn('没有启动文件的碎片地址，将使用本地版本文件进行版本控制！');
		versions = fs.existsSync(prj_path+ver_js) ?
			kit.parseVersion(fs.readFileSync(prj_path+ver_js, 'utf8')) : {};
		main();
		return;
	}
	console.log('正在加载版本文件 ...');
	kit.getVerion(prj, prj_conf.boot_inc, function (err, data) {
		if (err) {
			trace.error('加载版本文件错误：'+err);
			trace.warn('将使用本地版本文件进行版本控制！');
			versions = fs.existsSync(prj_path+ver_js) ?
				kit.parseVersion(fs.readFileSync(prj_path+ver_js, 'utf8')) : {};
		} else {
			versions = kit.parseVersion(data);
		}
		main();
	});
}
//更新版本文件
function updateVersionFile(files) {
	var file, deleted = [];
	updated_list = []; //updated_list将变成上传之后的地址列表
	//http://js.letvcdn.com/lc01_js/201504/02/11/50/lejs_1150/abc_ms.js
	for (file in files) {
		if (files.hasOwnProperty(file)) {
			versions[file][1] = files[file].slice(24, 45);
			updated_list.push(files[file]);
		}
	}
	files = [];
	new_vers = [];
	for (file in versions) {
		if (main_files.indexOf(file)<0) {
			deleted.push(file);
			versions[file][3] = 'deleted';
		} else {
			new_vers.push(kit.wrapKeyword(file.slice(0, -3))+':"'+versions[file][1]+'"')
		}
		files.push(file);
	}
	var ver = '';
	files.sort().forEach(function (f) {
		ver += versions[f].join('    ')+'\r\n';
	});
	sfs.write(path_min+ver_js, ver);
	
	deleted.length && trace.warn('请注意有main文件被删除了：'+deleted.join(', '));
}
//构建完成
function buildDone() {
	if (err_log.length) {
		trace.error(err_log.join('\n'));
		trace.error('\n====== 囧，发布项目失败了 TAT...');
		return;
	}
	trace.ok('\n====== 发布项目成功！======');
	trace.ok('总共用时：'+ (Date.now()-start_time)/1000 +' s.'+util.buildTime());
}
//压缩完成，开始上传文件
function uploadFiles() {
	console.log('\n开始上传有更新的文件');
	uploader.upload(prj, path_min, updated_list, function (err, data) {
		if (err) {
			err_log.push('上传文件错误：'+err);
			err_log.push('请重试或尝试在本地打包上线！');
			buildDone();
			return;
		}
		trace.ok('全部文件已上传完成');
		var boot_js = prj_conf.boot_js;
		if (!boot_js) {
			buildDone(); return;
		}
		console.log('\n正在更新和上传版本文件 ...');
		updateVersionFile(data);
		uploader.uploadOneFile(prj, path_min+ver_js, ver_js, function (err, data) {
			if (err) {
				err_log.push('上传版本文件错误：'+err);
				err_log.push('请重试或尝试在本地打包上线！');
				buildDone();
				return;
			}
			updated_list.push(data);
			console.log('上传完成');
			console.log('正在更新和上传启动文件 ...');
			var fc = fs.readFileSync(prj_path+boot_js, charset).split('<ver>');
			new_vers.push('__:"'+data.slice(24, 45)+'"');
			fc[1] = '*/\r\n'+new_vers.join(',')+'\r\n/*';
			sfs.write(path_min+boot_js, fc.join('<ver>'));
			uploader.uploadOneFile(prj, path_min+boot_js, boot_js, function (err, data) {
				if (err) {
					err_log.push('上传启动文件错误：'+err);
					buildDone();
				} else {
					updated_list.push(data);
					console.log('上传完成');
					console.log('正在检查所有文件是否真的上传成功 ...');
					kit.checkFiles(updated_list, function (err) {
						if (err) {
							err_log.push(err);
							err_log.push('有文件未上传成功，禁止上线！');
						} else {
							console.log('检查完成，全部文件已上传成功');
							trace.ok('\n上线地址：'+data);
						}
						buildDone();
					});
				}
			});
		});
	});
}
//压缩完成
function compressDone() {
	trace.ok('压缩完成');
	//console.log('用时：'+(Date.now()-start_time)/1000);
	if (is_release) {
		if (updated_list.length) {
			uploadFiles();
		} else {
			console.log('\n没有更新的文件，不需要上线');
			buildDone();
		}
	} else if (tester_id) {
		//复制启动文件
		if (prj_conf.boot_js) {
			var fc = fs.readFileSync(prj_path+prj_conf.boot_js, charset);
			fc = fc.replace('// isSupported = false;', 'isSupported = false;');
			sfs.write(path_min+prj_conf.boot_js, fc);
		}
		require('./deploy').deploy({
			isJS: true,
			testerId: tester_id,
			prj: prj,
			localDir: path_min,
			callback: function (err) {
				if (err) {
					trace.error('\n'+err);
					trace.error('\n部署项目失败');
				} else {
					trace.ok('\n====== 部署项目成功！======');
					trace.ok('总共用时：'+(Date.now()-start_time)/1000 +' s.'+util.buildTime());
				}
			}
		});
	} else {
		console.log('\n构建项目完成~\n');
	}
}
//压缩文件
function compressFiles(files) {
	console.log('开始压缩文件');
	var i = 0, len = files.length, compressCount = 0, cpuCount = require('os').cpus().length;
	var compress = function () {
		var file = files[i];
		console.log('=== 正在压缩：'+file+' 　- '+(len - i));
		i++;
		child_process.exec(compress_cmd.replace(/;/g, file), function (err) {
			if (err) {
				trace.error('压缩文件 '+file+' 发生错误：'+err.toString());
				return;
			}
			if (is_release) {
				var fc = fs.readFileSync(path_min+file, charset);
				//检查文件是否有修改
				var file_md5 = crypto.createHash('md5').update(fc).digest('hex').slice(0, 8);
				var ver = versions[file];
				if (ver && ver[2]===file_md5) {
					//文件未更改
					ver.length>3 && ver.pop(); //删除状态
				} else {
					versions[file] = [file, '', file_md5, ver?'updated':'newfile'];
					updated_list.push(file);
					path_tag && sfs.write(path_tag+file, fc);
				}
			}
			compressCount++;
			if (i<len) {
				compress();
			} else if (compressCount===len) {
				compressDone();
			}
		});
	};
	for (var j = 0; j<len && j<cpuCount; j++) {
		compress();
	}
}
//合并文件
function combineFiles() {
	console.log('\n开始合并文件');
	//读取main下的所有入口文件名
	fs.readdirSync(prj_path+'main').forEach(function (filename) {
		if (filename.slice(-3)==='.js') {
			main_files.push(filename);
		}
	});
	var i = 0, len = main_files.length, file = prj_conf.common_js, fc;
	if (file) {
		i = main_files.indexOf(file);
		if (i>-1) {
			main_files[i] = main_files[0]; 
			main_files[0] = file;
			fc = combine.combineCommonFile('main/'+file, prj, prj_path);
			if (fc===false) {
				err_log.push('合并文件 '+file+' 发生错误');
				buildDone();
				return;
			}
			sfs.write(path_main+file, fc);
			i = 1;
		} else {
			i = 0;
		}
	}
	
	for (; i<len; i++) {
		file = main_files[i];
		fc = combine.combineFile('main/'+file, prj, prj_path);
		if (fc===false) {
			err_log.push('合并文件 '+file+' 发生错误');
			buildDone();
			return;
		}
		sfs.write(path_main+file, fc);
	}
	compressFiles(main_files);
}
//开始执行任务
function main() {
	mkdir();
	is_release && console.log('版本文件加载、解析完成');
	combine.initBuild();
	combineFiles();
}

//opt 构建参数，包含以下几项：
//	prj 项目
//	isRelease 构建后是否发布，发布指上传文件到线上服务器
//	testerId 测试机id号
exports.build = function (opt) {
	prj = opt.prj;
	is_release = !!opt.isRelease;
	tester_id = opt.testerId;
	console.log('====== '+(is_release?'发布':'部署')+'项目 ['+prj+'] ======');

	var conf = require('../__config');
	var projects = conf.projects;
	kit.fixPrjConf(projects);
	prj_conf = projects[prj];
	prj_path = prj_conf.path;
	charset = prj_conf.charset;
	//build_data = prj_conf.build_data || {};
	build_path = prj_conf.build_path;
	path_main = build_path+'main/';
	path_min = build_path+'min/';
	path_updated = build_path+'updated/';
	main_files = [];
	updated_list = [];
	start_time = Date.now();
	err_log = [];
	sfs = new util.Sfs(charset);
	combine = require('./combine');
	prj_conf.no_global && (combine.combineFile = combine.combineNoGlobalFile);

	trace.warn('项目路径：'+prj_path+'    '+(prj_path.indexOf('trunk')>0?'(trunk)':'(branch)'));
	(prj_conf.depends || []).indexOf('vjs2')>-1 && trace.warn('vjs2路径：'+projects.vjs2.path);
	//处理uglifyjs压缩命令
	compress_cmd = conf.compress_cmd.replace('{filename}', path_main+';')
		.replace('{filename}', path_min+';');

	if (is_release) {
		if (prj_conf.boot_inc){
			path_tag = false; //不创建更新tag文件夹
		} else {
			var t = new Date(), h = t.getHours(), m = t.getMinutes();
			h<10 && (h = '0'+h);
			m<10 && (m = '0'+m);
			path_tag = path_updated+String(h)+String(m)+'/';
		}
		getVersions();
	} else {
		main();
	}
};
