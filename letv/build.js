/*--
	构建JS、CSS、HTML项目的总入口
*/
var trace = require('./lib/trace');
var _config = require('../__config');
var argv = require('./kit').parseCmdArgv();
var prj = argv.prj || 'lejs';
var prjconfig = _config.projects[prj];
var prj_path = prjconfig.path;

if(!prjconfig){
	trace.error('配置文件里项目 '+prj+' 不存在，请输入正确的项目名！');
	return;
}

if (prjconfig.type) {
	//css或html项目
	if (argv['-r']) {
		prjconfig.build_done = function (args, path_tag, version) {
			require('./uploadCss').upload(path_tag, prj, function () {
				trace.warn('\n项目路径：'+prj_path+'    '+(prj_path.indexOf('/branches/')>0?'(branch)':'(trunk)'));
			});
		};
	} else if (argv.t) {
		prjconfig.build_done = function (args, path_tag, version) {
			require('./deploy').deploy({
				testerId: argv.t,
				prj: prj,
				localDir: path_tag,
				callback: function () {
					trace.warn('\n项目路径：'+prj_path+'    '+(prj_path.indexOf('/branches/')>0?'(branch)':'(trunk)'));
					trace.ok('\n部署项目成功！');
				}
			});
		};
	}
	//格式化tag号
	prjconfig.format_tag = function(ver){
		var t = new Date(), M = t.getMonth()+1, d = t.getDate();
		if(!ver){
			var h = t.getHours(), m = t.getMinutes();
			h<10 && (h = '0'+h);
			m<10 && (m = '0'+m);
			ver = String(h)+String(m);
		}
		//前后都别加反斜线“/”
		return {
			//version: '' + t.getFullYear() + (M>9 ? M : '0'+M) +'/'+ (d>9 ? d : '0'+d) + '/'+prj+'/',
			folder_name: ver //存放所有更新的文件的文件夹名，在updated目录下
		};
	};
	require('mok-js').use('moktext/'+prjconfig.type).build({_cmd:'b', _prj:prj}, prjconfig, false);

} else {
	//js项目
	require('./build_js').build({
		prj: prj,
		isRelease: argv['-r'],
		testerId: argv.t
	});
}
