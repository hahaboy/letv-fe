/*--
	根据模块语法分析文件依赖，处理文件内容，合并项目文件
*/
var fs = require('fs'),
	util = require('./lib/util'),
	trace = require('./lib/trace'),
	kit = require('./kit'),
	reg_comment = /\/\*[\D\d]*?\*\//g,
	reg_define = /^[\t ]*define[\t ]*\([\t ]*(.+)$/m,
	reg_req = /^[\t ]*__req[\t ]*\([\t ]*['"](.+?)['"]/,
	charset, //文件编码，默认utf8
	err_log = [],
	mod_alias = {}, //key为模块别称，value为模块全称

	common_js,
	common_combined = {}, //公共文件common_js文件依赖的，用于排重
	combined_list, //已经合并的文件列表
	file_tree,
	tree_deep,
	contents,
	projects;

//检查模块是不是在：有时候会在一个项目里直接引用另外一个项目的模块
function isModuleInDependsPrj(mod) {
	for (var p in projects) {
		if (combined_list[p+':'+mod]) {
			return true;
		}
	}
	return false;
}

//初始化合并
function initCombine(is_common) {
	combined_list = {};
	if (common_js && !is_common) {
		for (var k in common_combined) {
			combined_list[k] = true;
		}
	}
	file_tree = ['/* file tree:'];
	tree_deep = 0;
	contents = '';
	err_log = [];
}

//合并文件
function combine(file, prj, prj_path) {
	var prj_file = prj+':'+file;
	combined_list[prj_file] = true;
	file_tree.push(util.repeat('|   ', tree_deep)+'|...'+prj_file);
	tree_deep++;

	//var file_content = [];
	//file_content.push('\r\n/* === '+prj_file+' === */');
	var fc = '', ltk;
	var is_exec_now = false; //是否在定义完模块后立即执行模块
	var lines = fs.readFileSync(prj_path+file, charset).replace(reg_comment, '')
		.replace(/^\s+/, '').replace(/\r/g, '').replace(reg_define, function ($0, $1) {
			ltk = '/* === '+prj_file+' === */\n;(LTK["';
			//解析define语法
			//var x = $1[0], mod_id = file.slice(0, -3).replace(/\//g, '.');
			var x = $1[0], mod_id = file.slice(0, -3);
			if (x==='f') { //define(function(){});
				//return 'define("'+mod_id+'", '+$1;
				return ltk+mod_id+'"] = '+$1;
			} else if (x==='\'' || x==='"') {
				//def2: define('main', function(){});
				//def3: define('-player', function(){});
				//return 'define('+$1.replace(/['"](.+?)['"]/, function (m, id) {
				return ltk+$1.replace(/['"](.+?)['"] *,/, function (m, id) {
					if (id[0]==='-') {
						is_exec_now = true;
						id = id.slice(1);
					}
					//id.replace(/\./g, '/');
					if (id!==mod_id) {
						//可以在这里检查是否定义了重复的模块，但以后要废弃define(alias这种语法！
						//所以先不检查了。。。
						mod_alias[id] = mod_id;
					}
					//return '"'+mod_id+'"'; //都统一成文件路径
					return mod_id+'"] =';
				});
			} else { //define({});    define([]);    ...    等形式
				//return 'define("'+mod_id+'", '+$1;
				return ltk+mod_id+'"] = '+$1;
			}
		}).split('\n');
	
	var i = 0, len = lines.length, line, req_ms, j, mod;
	for (; i < len; i++) {
		line = lines[i];
		req_ms = line.match(reg_req);
		if (req_ms) { //__req('bz/com/xxx.js');
			if (fc) { //遇到__req语句，则将之前积累的fc合并到contents里
				contents += fc, fc = '';
			}
			line = req_ms[1]; //复用line
			line.slice(-3)==='.js' || (line += '.js');
			if (line.indexOf('::')>0) { //__req('vjs::index.js');
				line = line.split('::');
				if (combined_list[line[0]+':'+line[1]]) {
					//file_tree.push(util.repeat('|   ', tree_deep)+'|.  '+line[0]+':'+line[1]);
				} else {
					var req_prj = line[0], fname = line[1];
					var p = projects[req_prj];
					if (!p) {
						err_log.push('MOKJS-007: '+prj_file+' 依赖的项目 '+
							req_prj+' 不存在！\nline '+(i+1)+': '+lines[i]);
						break;
					}
					p = p.path;
					if (fs.existsSync(p+fname)) {
						combine(fname, req_prj, p);
					} else if (fs.existsSync(p+'main/'+fname)) {
						combine('main/'+fname, req_prj, p);
					} else {
						err_log.push('MOKJS-006: '+prj_file+' 依赖的文件 '+
							req_ms[1]+' 不存在！\nline '+(i+1)+': '+lines[i]);
					}
				}
			} else {
				if (combined_list[prj+':'+line]) {
					//file_tree.push(util.repeat('|   ', tree_deep)+'|.  '+prj+':'+line);
				} else {
					fs.existsSync(prj_path+line) ? combine(line, prj, prj_path) :
						err_log.push('MOKJS-005: '+prj_file+' 依赖的模块 '+
							line.slice(0, -3)+' 不存在！\nline '+(i+1)+': '+lines[i]);
				}
			}
		} else if (line.indexOf('require')<0) { //90%以上无require吧
			//file_content.push(line);
			fc += line+'\r\n';
		} else { //require('air/event/givee');
			req_ms = kit.parseRequire(line, file);
			line = req_ms[0];
			req_ms = req_ms[1]; //复用req_ms
			j = req_ms.length;
			while (j--) {
				mod = req_ms[j];
				if (mod_alias[mod]){ //用别名引用模块
					line = line.replace('@'+mod+'@', mod_alias[mod]);
					req_ms[j] = mod_alias[mod];
				} else {
					mod.indexOf('/')>0 || (mod = mod.replace(/\./g, '/'));
					mod = util.resolvePath(file, mod);
					line = line.replace('@'+req_ms[j]+'@', mod);
					req_ms[j] = mod;
				}
			}
			//file_content.push(line);
			fc += line+'\r\n';
			while (req_ms.length) {
				line = req_ms.shift()+'.js'; //复用line
				if (combined_list[prj+':'+line]) {
					//file_tree.push(util.repeat('|   ', tree_deep)+'|.  '+prj+':'+line);
				} else {
					if (fs.existsSync(prj_path+line)) {
						combine(line, prj, prj_path);
					} else if (!isModuleInDependsPrj(line)) {
						err_log.push('MOKJS-004: '+prj_file+' 依赖的模块 '+
							line.slice(0, -3)+' 不存在！\nline '+(i+1)+': '+lines[i]);
					}
				}
			}
		}
	}
	//is_exec_now && file_content.push('require("'+file.slice(0, -3).replace(/\//g, '.')+'");');
	is_exec_now && (fc += 'require("'+file.slice(0, -3)+'");\r\n');
	contents += (ltk ? fc : '/* === '+prj_file+' === */\r\n'+fc);

	tree_deep--;
}

//合并输出prj项目下的filename文件
exports.output = function (prj, filename, res) {
	projects = require('../__config').projects;
	var prj_conf = projects[prj];
	if (!prj_conf) {
		res.writeHead(405);
		res.end('project ['+prj+'] is not found');
		return;
	}
	common_js = prj_conf.common_js;
	var is_common = filename===common_js;
	filename = filename[0]==='.' ? util.resolvePath('main/', filename) : 'main/'+filename;
	var prj_path = prj_conf.path;
	var file = prj_path+filename;
	
	res.writeHead(200, {
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'application/x-javascript',
		'Cache-Control': 'max-age=0'
	});
	if (fs.existsSync(file)) {
		console.log('output: '+prj+'/'+filename);
		charset = prj_conf.charset;
		initCombine(is_common);
		combine(filename, prj, prj_path);
		if (err_log.length) {
			trace.error(err_log.join('\n'));
			res.end('!alert("'+err_log.join('\\n\\n')
				.replace(/\n/g,'\\n').replace(/"/g,'\\"')+'");');
		} else {
			is_common && (common_combined = combined_list);
			res.end(file_tree.join('\r\n')+
				(prj_conf.no_global ? '\r\n*/\r\n~function () {\r\n'+contents+'\r\n}();' : '\r\n*/\r\n'+contents));
		}
		err_log = contents = combined_list = null;
		mod_alias = {};
	} else {
		//res.end('!alert("MOKJS-404: Not found. Wrong path ['+file+'].");');
		res.end('throw "['+file+'] is not found";');
		trace.error('output error: ['+file+'] is not found');
	}
};

//构建前初始化
exports.initBuild = function () {
	projects = require('../__config').projects;
	common_combined = {};
	common_js = false;
	charset = 'utf8';
};
//合并公共文件
exports.combineCommonFile = function (filename, prj, prj_path) {
	common_js = true;
	initCombine(true);
	combine(filename, prj, prj_path);
	if (err_log.length) {
		trace.error(err_log.join('\n'));
		return false;
	} else {
		common_combined = combined_list;
		return file_tree.join('\r\n')+'\r\n*/\r\n'+contents;
	}
};
//合并文件
exports.combineFile = function (filename, prj, prj_path) {
	initCombine(false);
	combine(filename, prj, prj_path);
	if (err_log.length) {
		trace.error(err_log.join('\n'));
		return false;
	} else {
		return file_tree.join('\r\n')+'\r\n*/\r\n'+contents;
	}
};
//无全局变量合并文件
exports.combineNoGlobalFile = function (filename, prj, prj_path) {
	initCombine(false);
	combine(filename, prj, prj_path);
	if (err_log.length) {
		trace.error(err_log.join('\n'));
		return false;
	} else {
		return file_tree.join('\r\n')+'\r\n*/\r\n~function () {\r\n'+contents+'\r\n}();';
	}
};
//构建完项目后清除缓存
exports.clear = function () {
	projects = common_combined = combined_list = null;
	mod_alias = {};
	contents = '';
	err_log = [];
};
