/*
	mokjs配置文件，详细请参考：http://mokjs.com/
*/
var mok = require('mok-js');
var http_port = 80;    //服务器默认监听端口
var webpage = '../../webpage';    //修改为你的webpage的路径

//项目配置
var projects = {
	'lejs': {
		path: '../lejs/trunk/',
		//path: '../lejs/branches/pad_play/',
		build_path: '../lejs/dist/',
		boot_js: 'abc.js',
		boot_inc: 'http://www.letv.com/commonfrag/sub_js.inc',
		common_js: 'base.js',
		depends: ['lib', 'vjs','vjs2'] //依赖的项目
	},
	'ms': {
		path: '../ms/trunk/',
		build_path: '../ms/dist/',
		boot_js: 'abc.js',
		boot_inc: 'http://www.letv.com/commonfrag/m-js-css-v2.inc',
		//common_js: 'base.js',
		depends: ['lib', 'vjs','vjs2', 'LMC']
	},
	'diy': {
		path: '../diy/trunk/',
		build_path: '../diy/dist/',
		boot_js: 'abc.js',
		boot_inc: 'http://www.letv.com/commonfrag/zt_diy_js.inc',
		depends: ['lib', 'lejs', 'ms']
	},
	'coop': {
		path: '../coop/trunk/',
		build_path: '../coop/dist/',
		boot_js: 'abc.js',
		boot_inc: 'http://www.letv.com/commonfrag/m-zt-js-css-v2.inc',
		depends: ["ms", "vjs","lib", "LMC"]
	},
	'pay': {    //支付的js项目
		path: '../pay/trunk/',
		build_path: '../pay/dist/',
		boot_js: 'abc.js',
		boot_inc: 'http://www.letv.com/commonfrag/pay-js-css.inc',
		depends: ['lib', 'ms', 'lejs']
	},
	'defray': {    //支付的css项目
		type: 'css',
		path: webpage+'/defray/trunk/',
		build_path: webpage+'/defray/dist/'
	},
	'vjs': {
		path: '../vjs/trunk/',
		depends: ['lib']
	},
	'vjs2': {
		path: '../vjs2/trunk/',
		//path: '../vjs2/branches/sdk/',
		//path: '../vjs2/branches/cde/',
		build_path: '../vjs2/dist/',
		depends: ['lib'],
		no_global : true
	},
	'lib': {
		path: '../lib/trunk/',
		depends: ['lib']
	},
	'LMC': {
		path: '../LMC/trunk/',
		build_path: '../LMC/dist/',
		boot_js: 'abc.js',
		depends: ['lib', 'vjs', 'ms', 'lejs']
	},
	'3rd': {
		path: '../3rd/trunk/',
		build_path: '../3rd/dist/',
		boot_js: 'abc.js',
		boot_inc: 'http://www.letv.com/commonfrag/3rd_js.inc'
	},
	'koala': {
		type: 'css',
		path: webpage+'/lekoala/css/',
		build_path: webpage+'/lekoala/min/css/'
	},
	'letv': {
		type: 'css',
		path: webpage+'/css/trunk/',
		build_path: webpage+'/css/dist/'
	},
	'mcss': {
		type: 'css',
		path: webpage+'/ms/webapp_letv/trunk/',
		build_path: webpage+'/ms_min/'
	},
	'pcclient': {
		type: 'css',
		path: 'D:/SVN/pc_client_web/builder/pc_letv/',
		build_path: 'D:/SVN/pc_client_web/builder/min/'
	},
	'html': {
		type: 'html',
		path: webpage+'/lekoala/html/',
		build_path: webpage+'/lekoala/min/html/',
		data: {
			$cssroot: 'http://s.letv.com/css/',
			$abc: 'http://js.letvcdn.com/lc02_js/201504/27/11/53/lejs/abc.js',
			$abc_diy: 'http://js.letvcdn.com/lc03_js/201504/27/11/05/diy/abc.js'
		},
		build_data: {
			$cssroot: webpage+'/css/'
		}
	}
};

//路由表
var routes = {
	'js.letvcdn.com': [
		{
			regexp: /^\/lc\d+_js\/\d+\/\d+\/\d+\/\d+\/(\w+)\/abc\.js$/,    //http://js.letvcdn.com/lc02_js/201504/13/18/46/lejs/abc.js
			// locate: function (match) {
			// 	var t = new Date();
			// 	console.log('output: '+match[1]+'/abc.js (Time: '+t.getHours()+':'+t.getMinutes()+':'+t.getSeconds()+')');
			// 	return projects[match[1]].path+'abc.js';
			// },
			handler: function (match, req, res) {
				var t = new Date();
				console.log('output: '+match[1]+'/abc.js (Time: '+t.getHours()+':'+t.getMinutes()+':'+t.getSeconds()+')');
				require('./letv/abc_output').output(projects[match[1]].path+'abc.js', '.js', res);
			}
		},
		{
			regexp: /^\/lc\d+_js\/\d+\/\d+\/\d+\/\d+\/sdk\/(\w+\.js)$/,    //http://js.letvcdn.com/lc03_js/201504/13/18/46/vjs2/index.js
			handler: function (match, req, res) {
				//require('./letv/combine').output('vjs2', match[1], res);
				mok.use('mok_modules/mok_break_host').request(req, res);
			}
		},
		{
			regexp: /^\/lc\d+_js\/\d+\/\d+\/\d+\/\d+\/(\w+)\/(\w+\.js)$/,    //http://js.letvcdn.com/lc03_js/201504/13/18/46/lejs/base.js
			handler: function (match, req, res) {
				if (match[1]==='ark') {
					mok.use('mok_modules/mok_break_host').request(req, res);
				} else {
					require('./letv/combine').output(match[1], match[2], res);
				}
			}
		},
		{
			regexp: /^\/js\/\d+\/\d+\/template\/\d+\/(\w+.*)$/,    //http://js.letvcdn.com/js/201504/14/template/18/a_camera_image.js
			locate: function (match, req, res) {
				var t = new Date();
				console.log('output: ark/'+match[1]+' (Time: '+t.getHours()+':'+t.getMinutes()+':'+t.getSeconds()+')');
				return '../ark/trunk/'+match[1];
			}
		}
	],
	'css.letvcdn.com': [
		{
			regexp: /^\/lc\d+_css\/\d+\/\d+\/\d+\/\d+\/letv\/([\w-]+\.css)$/,    //主站老css在letv目录下
			locate: function(match){
				console.log('output: letv/'+match[1]);
				return webpage+'/css/trunk/' + match[1];
			}
		},
		{
			regexp: /^\/lc\d+_css\/\d+\/\d+\/\d+\/\d+\/(\w+)\/([\w-]+\.css)$/,    //模块化的css项目：koala, mcss, defray
			handler: function (match, req, res) {
				var prj = match[1];
				console.log('output: '+prj+'/'+match[2]);
				mok.use('moktext/css').output('main/'+match[2], projects[prj], res);
			}
		},
		{
			regexp: /^\/css\/\d{6}\/\d{2}\/\d+\/(.+?\.css)$/,    //主站老css在letv目录下
			locate: function(match){
				console.log('output: letv/'+match[1]);
				return webpage+'/css/trunk/' + match[1];
			}
		}
	],
	'js.pcclient.com': [
		{
			regexp: /\.php$/,
			handler: function (match, req, res){
				mok.use('mok_modules/mok_break_host').request(req, res, '127.0.0.1:8081');
			}
		}, {
			regexp: /.*/,    //测试合并后的html
			root: 'D:/SVN/pc_client_web/js/dev'
		}
	],
	's.letv.com': [
		{
			regexp: /^\/css\/(.+?\.css)$/,
			project: 'koala'
		}, {
			regexp: /^\/min\/.*/,    //测试合并后的html
			locate: function(match){
				return webpage+'/lekoala' + match[0];
			}
		}, {
			regexp: /^.+?\.html$/,
			project: 'html'
		}, {
			regexp: /.+?\.pre$/,
			handler: function(match, request, response){
				mok.use('moktext/html').viewModule(match[0].slice(0,-3)+'html', projects['html'], response);
			}
		}
	],
	't.letv.com': [    //用于在本地调试的虚拟服务目录
		{
			regexp: /.*/,
			root: 'E:/'
		}
	],
	'localhost': [    //用于在本地调试的虚拟服务目录
		{
			regexp: /.*/,
			root: 'E:/'
		}
	]
};
//支持https，但https服务只监听默认的443端口
var https_routes = {
	'js-img.lecloud.com': [    // https://js-img.lecloud.com/lc02_js/201504/13/18/46/lejs/abc.js
		{
			regexp: /.+/,
			handler: function (match, req, res, relay) {
				req.$host = match[0].slice(-3)==='.js' ? 'js.letvcdn.com' : 'css.letvcdn.com';
				relay(req, res);
			}
		}
	]
};

exports.http_port = http_port;
exports.projects = projects;
exports.routes = routes;
//exports.https_routes = https_routes;
//js文件压缩命令，使用uglifyjs压缩
exports.compress_cmd = 'uglifyjs {filename} -m -c unused=true -o {filename}';

exports.proxy_conf = {
	'2001': {
		'js.letvcdn.com': [
			{
				regexp: /.+/,
				transfer: function () {
					return {
						host: '127.0.0.1',
						port: http_port
					};
				}
			}
		],
		'css.letvcdn.com': [
			{
				regexp: /.+/,
				transfer: function () {
					return {
						host: '127.0.0.1',
						port: http_port
					};
				}
			}
		]
	}
};
