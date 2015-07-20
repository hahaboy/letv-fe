
	var mokdoc = require('mokdoc');

	//主站
	mokdoc.config.set('lejs', {
		exclude_list: ['/air/'],
		path: 'D:/ws/lejs/trunk',	//源代码路径
		doc_path: 'D:/www/lejs'	//文档数据保存到哪里（要放到文档展示包里）
	});

	//air
	mokdoc.config.set('air', {
		path: 'D:/ws/air/trunk',
		doc_path: 'D:/www/air'
	});

	//M站
	mokdoc.config.set('mjs', {
		path: 'D:/ws/lejs/trunk',
		doc_path: 'D:/www/lejs'
	});

	var project = process.argv[2];
	if(!project){
		console.log('请输入项目名！');
		return;
	}

	mokdoc.start(project);
