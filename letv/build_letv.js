/*--
	压缩path_css目录下的所有css文件
	-author Bookin || @攻城氏
	-ver 2013-08-31
*/
var path_css = require('../__config').projects.koala.path.split('/lekoala/')[0]+'/css/css_min'; //相对路径，或者绝对路径
var charset = 'utf8'; //css文件编码

var FS = require('fs');
var reg_comment = /\/\*[\D\d]*?\*\//g, //注释，例如：/* CSS Document */
	reg_scs = /[;:{, }]/, //前后可能出现空白字符的符号
	_start_time = new Date(),
	h = _start_time.getHours(),
	m = _start_time.getMinutes();

h<10 && (h = '0'+h);
m<10 && (m = '0'+m);

var path_min = path_css+'/'+h+m+'/';
FS.existsSync(path_min) ? FS.readdirSync(path_min).forEach(function(file){
	FS.unlinkSync(path_min+file);
}) : FS.mkdirSync(path_min);

//获取打包结束时间：时:分:秒
function h_m_s(){
	var t = new Date(),
		h = t.getHours(), m = t.getMinutes(), s = t.getSeconds();
	return ' (build time: '+(h>9 ? h : '0'+h)+':'+(m>9 ? m : '0'+m)+':'+(s>9 ? s : '0'+s)+')';
}

//压缩css内容
function compressCss(fc) {
	var content = fc.replace(reg_comment, '').replace(/^[\s\r\n]+/, ''),
		i = 0, len = content.length,
		buf = '', //压缩结果buffer
		lc = '', //前一个字符
		c;
	for (; i < len; i++) {
		c = content[i];
		if (c==='\r' || c==='\n') {
			continue;
		}
		if (c===' ' || c==='\t') {
			if (reg_scs.test(lc)) {
				continue;
			}
			buf += lc;
			lc = ' ';
			continue;
		} else if (reg_scs.test(c)) {
			if (lc===' ' || (c==='}' && lc===';')) {
				lc = c;
				continue;
			}
		}
		buf += lc;
		lc = c;
	}

	return buf + lc;
}

console.log('正在合并压缩CSS文件 ...');

var main_files = FS.readdirSync(path_css),
	main_len = main_files.length, mainfile, fc, fd;
//过滤非css文件
while(main_len--){
	mainfile = main_files[main_len];
	if(mainfile.slice(-4)==='.css'){
		fc = FS.readFileSync(path_css+'/'+mainfile, charset);
		//压缩过的文件写到min下
		fd = FS.openSync(path_min+'/'+mainfile, 'w', '0666');
		FS.writeSync(fd, compressCss(fc), 0, charset);
		FS.closeSync(fd);
	}
}

console.log('压缩完成');

var argv = require('./kit').parseCmdArgv();
if (argv['-r']) {
	require('./uploadCss').upload2(path_min, 'letv', function () {
		console.log('总共用时：'+(new Date()-_start_time)/1000+' s.'+h_m_s());
	});
} else if (argv.t) {
	require('./deploy').deploy({
		testerId: argv.t,
		prj: argv.prj,
		localDir: path_min,
		callback: function () {
			console.log('\n部署项目成功！');
			console.log('总共用时：'+(new Date()-_start_time)/1000+' s.'+h_m_s());
		}
	});
}
