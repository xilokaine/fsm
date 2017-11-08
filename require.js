/**
    Provide a require like function following standard module loading
    Global context references are preserved between calls
 */
// Set global properties if not already loaded
if (!this.require) {
    var exports;
    var module = {};
    var __dirname = "/";

    (function (root) {

        var has = Object.prototype.hasOwnProperty;

        // Cache the require modules
        var cache = {};

        function normalize (list) {
            var up = 0;
            for (var i = list.length - 1; i >= 0; i--) {
                var last = list[i];
                if (last === ".") {
                    list.splice(i, 1);
                } else if (last === "..") {
                    list.splice(i, 1);
                    up++;
                } else if (up) {
                    list.splice(i, 1);
                    up--;
                }
            }

            return list;
        }

        function dirname (f) {
            var i = f.lastIndexOf("/");
            return i < 0
                ? "/"
                : f.slice(0, i)
            ;
        }

        // Remove duplicate slashes
        var normalizeRex = /\/\/+/g;

        function require (id) {
            // Make sure it is full path
            var _id = normalize( ((id.charAt(0) === "/" ? "" : __dirname + "/") + id).replace(normalizeRex, "/").split("/") ).join("/");

 print("__dirname="+__dirname+" id="+id+" _id="+_id)
            if ( !has.call(cache, _id) ) {
                var _exports = exports;
                module.exports = exports = {};
                var _dirname = __dirname;
                __dirname = dirname(_id);
                load('.'+_id);
                cache[_id] = module.exports;

                __dirname = _dirname;
                module.exports = exports = _exports;
            }

            return cache[_id];
        }

        // Expose require
        root.require = require;

    })(this)
}