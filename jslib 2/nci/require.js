/**
	Provide a require like function following standard module loading
 */
// Set global properties if not already loaded
if (!this.module) {
	var exports;
	var module = { exports: exports };
}
;(function (root) {

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

	var normalizeRex = /\/\//g;
	function require (id) {
		var _id = normalize( id.replace(normalizeRex, "/").split("/") ).join("/");

		if ( !module.hasOwnProperty(_id) ) {

			// Keep a reference to the current exports, in case of nested require calls
			var _exports = module.exports;
			// var _module = module;
			module.exports = exports = {};
			// Load(_id);
			load(_id);
			module[_id] = module.exports;

			// Restore the previous exports
			// module = _module;
			module.exports = exports = _exports;
		}

		return module[_id];
	}

	// Expose require
	root.require = require;

})(this)