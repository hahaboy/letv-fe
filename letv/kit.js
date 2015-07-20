/*--
	工具箱
*/
exports.parseRequire = function (line, srcfile) {
	line = '!'+line.replace('LTK.require', 'require');
	var req = 'require\n', ri = 0, j, c,
		i = 1, l = line.length,
		q = '', //存放单引号或双引号，为空则意味着不在字符串里
		r = '', m = '', ms = [];
	for (; i < l; i++) {
		c = line[i];
		if (c==='"' || c==="'") {
			if (c===q && line[i-1]!=='\\') { //字符串结束
				q = '';
				if (ri>7) { //收集模块结束
					if (m) {
						//if (abbr_mod[m]) { //是简称
						//	ms.push(abbr_mod[m]);
						//} else {
							//m.indexOf('/')>0 || (m = m.replace(/\./g, '/')); //替换.那种用法
							//m = util.resolvePath(srcfile, m);
							m.slice(-3)==='.js' && (m = m.slice(0, -3));
							ms.push(m);
							//m = mod_abbr[m] || m;
						//}
						//console.log(m);
						r += '@'+m+'@';
					}
					m = '', ri = 0;
				}
			} else {
				q || (q = c); //q不存在 则字符串开始
			}
		} else if (q==='') { //不在字符串里
			if (c===req[ri]) {
				j = i, ri++;
			} else if (ri>6) {
				if (c==='(') {
					ri = /[\w.$]/.test(line[j-7]) ? 0 : 8;
				} else if (c!==' ' && c!=='\t') {
					ri = 0;
				}
			} else if (c==='/' && line[i-1]==='/') {
				r += line.slice(i);
				break;
			} else {
				ri = 0;
			}
		} else if (ri>7) { //收集模块ing，btw 模块名不能包含单双引号！
			c===' ' || c==='\t' ?
				console.log(srcfile+' 里引用的模块名包含空白字符！') : (m += c);
			continue;
		}
		r += c;
	}
	return [r, ms];
};

//修正项目配置：1、路径后加反斜线；2、默认编码使用utf8
exports.fixPrjConf = function (projects) {
	var p, conf;
	for (p in projects) {
		conf = projects[p];
		conf.path && conf.path.slice(-1)!=='/' && (conf.path += '/');
		conf.build_path && conf.build_path.slice(-1)!=='/' && (conf.build_path += '/');
		conf.charset || (conf.charset = 'utf8');
	}
};

//解析版本文件：包括 主文件版本 和 各模块的固定编号
//base.js    01_js/201504/02/11/50    fba7dd25    new
//index.js    01_js/201504/02/11/50    fba8adf5
exports.parseVersion = function (fc) {
	var items = fc.replace(/\r/g, '').split('\n');
	var vers = {};
	var i = 0, len = items.length, item;
	for (; i < len; i++) {
		item = items[i].split('    ');
		if (item.length>2 && item[3]!=='deleted') {
			vers[item[0]] = item;
		}
	}
	return vers;
};

//获取版本文件，版本文件的地址在启动文件里，启动文件又要从启动文件的碎片里去找
//	boot_inc 启动文件的碎片地址，例如 http://www.letv.com/commonfrag/sub_js.inc
//体验一把层层回调，这是人家第一次这么干噢。。。
exports.getVerion = function (prj, boot_inc, callback) {
	var file = require('./get_online_file');
	file.get(boot_inc, function (err, data) {
		if (err) {
			callback('[kit.getVerion] 获取公共碎片失败：'+boot_inc);
			return;
		}
		var match = data.match(/["'](http:.+?abc\.js)["']/);
		var boot_js = match ? match[1] : (callback('boot_inc error: '+boot_inc), false);
		boot_js && file.get(boot_js, function (err, data) {
			if (err) {
				callback('[kit.getVerion] 获取启动文件失败：'+boot_js+' < '+boot_inc);
				return;
			}
			match = data.match(/__:["'](.+?)["']/);
			var version = match ? match[1] : (callback('boot_js error: '+boot_js), false);
			version && (version = 'http://js.letvcdn.com/lc'+version+'/'+prj+'/_version.js');
			version && file.get(version, function (err, data) {
				if (err) {
					callback('[kit.getVerion] 获取版本文件失败：'+
						version+' < '+boot_js+' < '+boot_inc);
					return;
				}
				callback(false, data);
			});
		});
	});
};

//给 js保留字 或 非纯字母数字字符串 加上双引号
exports.wrapKeyword = (function () {
	var kw = ('abstract boolean break byte case catch char class const continue debugger default delete do double'+
	' else enum export extends false final finally float for function goto var void volatile while with'+
	' if implements import in instanceof int interface long native new null package private protected public'+
	' return short static super switch synchronized this throw throws transient true try typeof').split(' ');
	var j = kw.length, jskw = {}, reg_w = /^[^\d]\w+$/;
	while (j--) {
		jskw[kw[j]] = true;
	}
	kw = null;
	return function (word) {
		return (jskw[word] || !reg_w.test(word)) ? '"'+word+'"' : word;
	};
})();

//解析命令参数
exports.parseCmdArgv = function () {
	var args = process.argv.slice(2);
	var argv = {};
	var i = args.length, j, arg;
	while (i--) {
		arg = args[i];
		j = arg.indexOf('=');
		if (j>0) {
			argv[arg.slice(0, j)] = arg.slice(j + 1);
		} else {
			argv[arg] = arg; //没有参数值的，以参数名作为参数值
		}
	}
	if (/^\w+$/.test(args[0])) {
		argv.prj = args[0];
	}
	return argv;
};

function asynEach(items, handler, onEnd) {
	var i = 0, len = items.length;
	var op = function () {
		if (i===len) {
			onEnd();
			return;
		}
		handler(items[i], i++, op);
	};
	op();
}
//检查上传到生成环境的文件是否真的上传成功
exports.checkFiles = function (files, callback) {
	var checker = require('./check_online_file');
	asynEach(files, function (file, i, next) {
		checker.check(file, function (err) {
			//console.log('check file: '+file);
			if (err) {
				callback('[kit.checkFiles] 文件读取失败：'+file);
				//console.log('error!');
				return;
			}
			next();
		});
	}, callback);
};
