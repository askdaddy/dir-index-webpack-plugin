const config = require("./options.json");

function DirIndexPlugin(opt) {
    if (opt.hasOwnProperty("dir")) config.dir = opt.dir;
    if (opt.hasOwnProperty("indexFileName")) config.indexFileName = opt.indexFileName;
}

var fs = require("fs");
var path = require('path')

function noDotFiles(x) {
    return x[0] !== '.'
}

function readDirSyncRecursive(root, filter, files, prefix) {
    prefix = prefix || ''
    files = files || []
    filter = filter || noDotFiles

    let dir = path.join(root, prefix)
    if (!fs.existsSync(dir)) return files
    if (fs.statSync(dir).isDirectory()) {
        fs.readdirSync(dir)
            .filter(function (name, index) {
                return filter(name, index, dir)
            })
            .forEach(function (name) {
                readDirSyncRecursive(root, filter, files, path.join(prefix, name))
            });
    } else
        files.push(prefix)

    return files
}

DirIndexPlugin.prototype.apply = function (compiler) {
    const pluginName = this.constructor.name;
    let dir = config.dir;
    if (dir.length <= 0) throw 'please set a target dir [ option : {src: <target_dir>} ]';
    dir = path.resolve(compiler.options.context, dir);
    if (compiler.options.context == dir) throw 'Do NOT index at project root !!!';

    compiler.hooks.beforeRun.tapAsync(pluginName, function (compilation, callback) {
        const files = readDirSyncRecursive(dir);

        const idx_fn = path.resolve(dir, config.indexFileName);
        // write
        fs.writeFileSync(idx_fn, JSON.stringify({"files": files}),{encoding:"utf8",flag:"w"});

        callback();
    });
}

module.exports = DirIndexPlugin;
