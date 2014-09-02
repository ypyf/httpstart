#!/usr/bin/env node

var mime = require('mimemap');
var http = require('http');
var fs = require('fs');
var url = require('url');
var cmd = require('commander');

cmd.option('-p --port <port>', 'Server port [8000]', parseInt)
   .option('-d --dir <dir>', 'Server root directory [CWD]')
   .parse(process.argv);

var DocRoot = cmd.dir || process.cwd();
console.log(DocRoot);

var port = cmd.port || 8000;
console.log('Listening on port ' + port.toString() + '...');

function MIMEType(filename) {
    var parsed = filename.match(/[.](.*)$/);
    if (!parsed)
        return false;
    var ext = parsed[1];
    return mime.map[ext];
}

http.createServer(function(req, res){
    var parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname.split("/");
    var localPath = decodeURI(parsedUrl.pathname);
    //  "<dir>/.." => ""
    localPath = localPath.replace(/[^/]+\/+[.][.]/g, "");
    localPath = DocRoot + localPath.replace(/[.][.]/g, ".");

    var headers = {};

    fs.stat(localPath, function (err, stats) {
        if (err) {
            headers["Content-Type"] = "text/html;charset=utf-8";
            res.writeHead(404, headers);
            res.write(err + "<h2>404 File Not Found</h2><hr />" + 'HttpStart' + "\n");
            res.end();
        }
        // 列出目录
        else if (stats.isDirectory()) {
            // 补全URL中目录后的'/'
            if (parsedUrl.pathname[parsedUrl.pathname.length - 1] != '/') {
                res.writeHead(302, {
                    'Location':parsedUrl.pathname + '/'
                });
                res.end();
            } else {
                fs.readdir(localPath, function (err, files) {
                    headers["Content-Type"] = "text/html;charset=utf-8";
                    res.writeHead(200, headers);
                    res.write('<ul>');
                    for (var i in files)
                        res.write('<li>' + '<a href="' + files[i] + '">' + files[i] + '</a></li>');
                    res.write('</ul>');
                    res.end();
                });
            }
        }
        // 显示文件内容
        else {
            fs.readFile(localPath, function (err, data) {
                var mimetype = MIMEType(parsedUrl.pathname);
                if (mimetype)
                    headers["Content-Type"] = mimetype;
                res.writeHead(200, headers);
                res.write(data);
                res.end();
            });
        }
    });
}).listen(port);

