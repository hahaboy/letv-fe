/*--
	自动部署测试机上的nginx配置
	-author hahaboy
*/
var tester_conf = require('../__tester_config');
var nginxConfDir = tester_conf.nginxConfDir; //配置根路径
var nginx_conf = nginxConfDir+'/nginx.conf'; //配置文件
var backup_conf = nginxConfDir+'/nginx-2015-05-19.conf'; //配置文件备份名字
var testers = {22: {host: '10.154.156.22', conf: '22-nginx.conf'},
	23: {host: '10.154.156.23', conf: '23-nginx.conf'},
	24: {host: '10.154.156.24', conf: '24-nginx.conf'},
	25: {host: '10.154.156.25', conf: '25-nginx.conf'},
	26: {host: '10.154.156.26', conf: '26-nginx.conf'},
	27: {host: '10.154.156.27', conf: '27-nginx.conf'},
	28: {host: '10.154.156.28', conf: '28-nginx.conf'},
	29: {host: '10.154.156.29', conf: '29-nginx.conf'},
	30: {host: '10.154.156.30', conf: '30-nginx.conf'},
	31: {host: '10.154.156.31', conf: '31-nginx.conf'}}; //测试数据
testers = tester_conf.testers;
var testerIds = Object.keys(testers);

var Client = require('ssh2').Client;
var trace = require('./lib/trace');

//重启nginx
var reloadNginx = function (testerId, conn) {
	conn.exec('/usr/local/nginx/sbin/nginx -s reload', function (err) {
		if (err) {
			trace.error('重启nginx错误：'+err);
			return;
		}
		trace.ok('测试机 '+testerId+' 配置同步成功！');
		conn.end();
		deploy();
	});
};

//同步配置文件
var deploy = function (opt) {
	if (testerIds.length===0) {
		trace.ok('=== 同步完成 ===');
		return;
	}
	var testerId = testerIds.shift();
	var conf = tester_conf.getConf(testerId, 'lejs');
	var data = conf.data;
	if (data.webroot) {
		deploy();
		return;
	}
	var conn = new Client();
	conn.on('ready', function () {
		//console.log('Client :: ready');
		conn.sftp(function (err, sftp) {
			if (err) {
				trace.error('创建sftp错误：'+err);
				return;
			}
			//sftp.rename(nginx_conf, backup_conf, function (err) {
			//	if (err) {
			//		trace.error('备份nginx.conf文件错误：'+err);
			//		return;
			//	}
				sftp.fastPut('./nginx_conf/'+(data.conf||'nginx.conf'), nginx_conf,
					function (err) {
					if (err) {
						trace.error('上传nginx.conf文件错误：'+err);
						return;
					}
					if (data.jsconf) {
						//上传js.conf
						sftp.fastPut('./nginx_conf/'+data.jsconf, nginxConfDir+'/js.conf',
							function (err) {
							if (err) {
								trace.error('上传js.conf文件错误：'+err);
								return;
							}
							reloadNginx(testerId, conn);
						});
					} else {
						reloadNginx(testerId, conn);
					}
				});
			//});
		});
	});
	conn.connect(conf.auth);
};

//删除备份配置文件
var deleteBackup = function (opt) {
	if (testerIds.length===0) {
		trace.ok('=== 删除完成 ===');
		return;
	}
	var testerId = testerIds.shift();
	var conf = tester_conf.getConf(testerId, 'lejs');
	var data = conf.data;
	if (data.webroot) {
		deleteBackup();
		return;
	}
	var conn = new Client();
	conn.on('ready', function () {
		//console.log('Client :: ready');
		conn.sftp(function (err, sftp) {
			if (err) {
				trace.error('创建sftp错误：'+err);
				return;
			}
			sftp.unlink(backup_conf, function (err) {
				if (err) {
					trace.error('备份nginx.conf文件错误：'+err);
					return;
				}
				trace.ok('测试机 '+testerId+' 备份配置删除成功！');
				conn.end();
				deleteBackup();
			});
		});
	});
	conn.connect(conf.auth);
};

var action = process.argv[2];
if (!action || action==='deploy') {
	console.log('=== 开始同步 ===');
	deploy();
} else if (action==='del') {
	console.log('=== 开始删除 ===');
	deleteBackup();
}
