/*--
	乐视前端开发集成环境
	-author hahaboy
*/
var mok = require('mok-js');
var config = require('./__config');
mok.start(config);
mok.watchConfig('__config.js');
