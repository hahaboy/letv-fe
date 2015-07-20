/*--
	测试机配置
*/
var authDefault = {
	user: 'xxx',    //保密原因，用户名请从内网wiki上获取
	password: 'xxx',    //保密原因，密码请从内网wiki上获取
	port: 22
};
var dirDefault = {
	pay: '/letv/www/js/pay',
	defray: '/letv/www/css/defray',
	lejs: '/letv/www/js/lejs',
	ms: '/letv/www/js/ms',
	diy: '/letv/www/js/diy',
	coop: '/letv/www/js/coop',
	vjs2 : '/letv/www/js/sdk',
	koala: '/letv/www/css/koala',
	letv: '/letv/www/css/letv',
	mcss: '/letv/www/css/mcss'
};
//测试机id 对应 测试机配置
var testers = {
	22: {host: '10.154.156.22', conf: '22-nginx.conf'},
	23: {host: '10.154.156.23', conf: '23-nginx.conf'},
	24: {host: '10.154.156.24', conf: '24-nginx.conf'},
	25: {host: '10.154.156.25', conf: '25-nginx.conf'},
	26: {host: '10.154.156.26', conf: '26-nginx.conf'},
	27: {host: '10.154.156.27', conf: '27-nginx.conf'},
	28: {host: '10.154.156.28', conf: '28-nginx.conf'},
	29: {host: '10.154.156.29', conf: '29-nginx.conf'},
	30: {host: '10.154.156.30', conf: '30-nginx.conf'},
	31: {host: '10.154.156.31', conf: '31-nginx.conf'},
	/* === 以下20台为虚拟出来的测试机，分别对应在上面10台机子上面 === */
	101: {vhost: '10.154.238.101', host: '10.154.156.22', webroot: 'www1'},
	102: {vhost: '10.154.238.102', host: '10.154.156.23', webroot: 'www1'},
	103: {vhost: '10.154.238.103', host: '10.154.156.24', webroot: 'www1'},
	104: {vhost: '10.154.238.104', host: '10.154.156.25', webroot: 'www1'},
	105: {vhost: '10.154.238.105', host: '10.154.156.26', webroot: 'www1'},
	106: {vhost: '10.154.238.106', host: '10.154.156.27', webroot: 'www1'},
	107: {vhost: '10.154.238.107', host: '10.154.156.28', webroot: 'www1'},
	108: {vhost: '10.154.238.108', host: '10.154.156.29', webroot: 'www1'},
	109: {vhost: '10.154.238.109', host: '10.154.156.30', webroot: 'www1'},
	110: {vhost: '10.154.238.110', host: '10.154.156.31', webroot: 'www1'},
	111: {vhost: '10.154.238.111', host: '10.154.156.22', webroot: 'www2'},
	112: {vhost: '10.154.238.112', host: '10.154.156.23', webroot: 'www2'},
	113: {vhost: '10.154.238.113', host: '10.154.156.24', webroot: 'www2'},
	114: {vhost: '10.154.238.114', host: '10.154.156.25', webroot: 'www2'},
	115: {vhost: '10.154.238.115', host: '10.154.156.26', webroot: 'www2'},
	116: {vhost: '10.154.238.116', host: '10.154.156.27', webroot: 'www2'},
	117: {vhost: '10.154.238.117', host: '10.154.156.28', webroot: 'www2'},
	118: {vhost: '10.154.238.118', host: '10.154.156.29', webroot: 'www2'},
	119: {vhost: '10.154.238.119', host: '10.154.156.30', webroot: 'www2'},
	120: {vhost: '10.154.238.120', host: '10.154.156.31', webroot: 'www2'},
	/* 用下面的代码生成上面那20条数据
		var s = "", i, no;
		for (i = 0; i < 10; i++) {
			no = String(i+101);
			s += no+": {vhost: '10.154.238."+no+"', host: '10.154.156."+(i+22)+"', webroot: 'www1'},\r\n";
		}
		for (i = 0; i < 10; i++) {
			no = String(i+111);
			s += no+": {vhost: '10.154.238."+no+"', host: '10.154.156."+(i+22)+"', webroot: 'www2'},\r\n";
		}
		console.log(s);
	*/
	34: {host: '10.154.252.34', conf: '34-nginx.conf'},
	73: {host: '10.154.252.73', conf: '73-nginx.conf', jsconf: 'js.conf'},
	74: {host: '10.154.252.74'},
	75: {host: '10.154.252.75'},
	//'192.74': {host: '10.182.192.74', user: 'root'},
	//'192.75': {host: '10.182.192.75', user: 'root'},
	//87: {host: '10.154.250.87', user: 'root'}, //堡垒机跳转
	126: {host: '10.200.89.126', conf: '126-nginx.conf', jsconf: 'js.conf'},
	127: {host: '10.200.89.127', conf: '126-nginx.conf', jsconf: 'js.conf'}, //same as 126
	128: {host: '10.200.89.128', conf: '128-nginx.conf'},
	129: {host: '10.200.89.129'},
	130: {host: '10.200.89.130'},
	164: {host: '10.154.252.164'}
	//212: {host: '220.181.153.212', user: 'root'}
};

exports.nginxConfDir = '/usr/local/nginx/conf'; //nginx配置文件目录
exports.testers = testers;

//id 测试机id
//prj 项目名
exports.getConf = function (opt) {
	var auth = {}, tester = testers[opt.testerId], prj = opt.prj;
	if (!tester) {
		return null;
	}
	for (var k in authDefault) {
		auth[k] = tester[k] || authDefault[k];
	}
	auth.host = tester.host;
	var dir = tester[prj];
	if (!dir) {
		dir = dirDefault[prj] || (opt.isJS ? '/letv/www/js/'+prj : '/letv/www/css/'+prj);
		tester.webroot && (dir = dir.replace('/www/', '/'+tester.webroot+'/'));
	}
	return {
		auth: auth,
		dir: dir,
		data: tester
	};
};
