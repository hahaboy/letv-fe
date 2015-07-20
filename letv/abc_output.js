var fs = require('fs');

exports.output = function(file, file_ext, res) {
    if (!fs.existsSync(file)) return;

    res.writeHead(200, {
        'Cache-Control': 'no-cache,max-age=0',
        'Content-Type': 'application/x-javascript'
    });

    var content = fs.readFileSync(file, 'utf8');

    content = content.replace('// isSupported = false;', 'isSupported = false;');
    //content = content.replace("location.href.indexOf('debug') > 0 &&", "// location.href.indexOf('debug') > 0 &&");

    res.write(content);
    res.end();
}