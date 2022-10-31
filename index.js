const config = {
    dir: "",
    indexFileName: "index.json",
    exclude: /\.json$/
}
const EMPTY = "";

function DirIndexPlugin(opt) {
    if (opt.hasOwnProperty("dir")) config.dir = opt.dir;
    if (opt.hasOwnProperty("indexFileName")) config.indexFileName = opt.indexFileName;
    if (opt.hasOwnProperty("exclude")) config.exclude = opt.exclude;

}

const fs = require("fs");
const path = require('path')

function excludeFilter(x) {

    if (x[0] === '.') return false;

    if (config.exclude !== undefined && config.exclude.test(x)) return false;

    return true;
}

function readDirSyncRecursive(root, filter, files, prefix) {
    prefix = prefix || ''
    files = files || []
    filter = filter || excludeFilter

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
    dir = path.join(compiler.options.context, dir);
    if (compiler.options.context === dir) throw 'Do NOT index at project root !!!';

    compiler.hooks.beforeCompile.tapAsync(pluginName, function (compilation, callback) {
        const files = readDirSyncRecursive(dir)
            , dist = Array.from(files, f => {
            return f.split(path.sep).join(path.posix.sep);
        });

        const idx_fn = path.join(dir, config.indexFileName);


        // write
        fs.writeFileSync(idx_fn, JSON.stringify({"files": dist}), {encoding: "utf8", flag: "w"});

        callback();
    });
}

module.exports = DirIndexPlugin;
