/*--
	部署代码到测试机
*/
var Client = require('ssh2').Client;
var trace = require('./lib/trace');
var conf_path = '../__tester_config';

function putFiles(dir, opt, sftp, conn) {
	var localDir = opt.localDir;
	localDir.slice(-1)==='/' || (localDir += '/');
	var files = require('fs').readdirSync(localDir);
	var i = 0, len = files.length, filename, error;
	var put = function () {
		if (i<len) {
			filename = files[i];
			console.log('=== 正在上传：'+filename+' 　- '+(len - i));
			sftp.fastPut(localDir+filename, dir+'/'+filename, function (err) {
				if (err) {
					trace.error('文件上传错误：'+filename);
					error = true;
				}
				i++;
				put();
			});
		} else {
			conn.end();
			error ? trace.warn('\n有文件上传错误，其他文件已上传到测试机：'+opt.host+' '+dir) :
				trace.ok('\n全部文件已上传到测试机：'+opt.host+' '+dir);
			opt.callback();
		}
	};
	put();
}

//部署项目，部署参数opt，包含：
//	isJS 是否JS项目
//	testerId 测试机id
//	prj 要部署的项目
//	localDir 要部署到测试机的本地目录
//	callback 部署之后的回调
exports.deploy = function (opt) {
	require.cache[require.resolve(conf_path)] = null;
	var conf = require(conf_path).getConf(opt);
	if (!conf) {
		opt.callback('测试机 ['+opt.testerId+'] 不存在');
		return;
	}
	var dir = conf.dir;
	var conn = new Client();
	conn.on('ready', function () {
		//console.log('Client :: ready');
		conn.sftp(function (err, sftp) {
			if (err) {
				opt.callback('创建sftp错误：'+err);
				return;
			}
			opt.host = conf.data.vhost || conf.data.host;
			sftp.mkdir(dir, function (err) {
				//if (err) throw err;
				console.log('\n开始上传文件到测试机');
				putFiles(dir, opt, sftp, conn);
			});
		});
	});
	conn.connect(conf.auth);
	//console.log(dir, conf.auth);
};
