/*--
	读取virtual-nginx.conf模板自动生成22~31的nginx.conf文件
*/
var util = require('../lib/util');
var sfs = util.getSfs('utf8');
var content = require('fs').readFileSync('./virtual-nginx.conf', 'utf8');

for (var i = 0; i < 10; i++) {
	var fc = content;
	fc = fc.replace(/\{\{no\}\}/g, String(i+22));
	fc = fc.replace(/\{\{vno1\}\}/g, String(i+101));
	fc = fc.replace(/\{\{vno2\}\}/g, String(i+111));
	sfs.write(String(i+22)+'-nginx.conf', fc);
}
