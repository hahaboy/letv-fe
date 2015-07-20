/*--
	上传js、css文件到CDN的上传配置
	-note 保密原因，“xxxxxxxxxx”请从内网wiki上获取
	-author hahaboy
*/
exports.api = 'http://upload2.lelecdn.com:8000/xxxxxxxxxx.php';

exports.requestOptions = {
	'parse': true,
	'multipart': true,
	'host': 'upload2.lelecdn.com',
	'port': '8000',
	'path': '/xxxxxxxxxx.php',
	'method': 'POST',
	'headers': {
		'Cookie': 'upload_username=jsgroup;upload_token=xxxxxxxxxx;PHPSESSID=xxxxxxxxxx',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Encoding': 'gzip,deflate,sdch',
		'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
		'Content-Type': 'multipart/form-data'
	}
};

exports.error_msg = [
	'-',
	'上传成功',
	'上传重复',
	'上传文件格式不符合上传条件，拒上传',
	'身份验证失败',
	'上传文件大小不在允许上传范围之内',
	'上传文件名含中文或者空格',
	'文件上传失败'
];

exports.username = 'liubin1';

exports.md5str = 'xxxxxxxxxx';
