/**
  Javascript console object for Netcool/Impact
  Provides the following methods:
  console.log: mapped to Netcool/Impact log level of 0
  console.error: mapped to Netcool/Impact log level of 0
  console.fatal: mapped to Netcool/Impact log level of 0
  console.warn: mapped to Netcool/Impact log level of 1
  console.info: mapped to Netcool/Impact log level of 2
  console.debug: mapped to Netcool/Impact log level of 3
  console.level: returns the current Netcool/Impact PolicyLogger log level
  console.tag: returns a new instance of the console applying the given tag to all logs
 
  All methods accept a formating string as the first argument:
  %s : String
  %d: Number
  %b: Number in binary format
  %x: Number in hexadecimal format
  %j: JSON
  %o: a Netcool/Impact object
  %%: the % character
 */
// Utils
Load("/nci/utils");

// Emulate the console object
;(function (root) {
	var logSeparator = new Array(50).join('#');

	var console = {
		level: function () {
			return nciutils.getPolicyLogger("LogLevel") || 0;
		}
	,	dir: function (obj) {
			console.log( "%o", obj );
		}
	,	clear: function () {
			Log( 0, logSeparator );
		}
	// Clone the console and add a custom tag to every log message
	// @return {Object} the tagged console
	,	tag: function () {
			var tag = nciutils.format( _.toArray(arguments) );
			return doTag( _.clone(console), tag );
		}
	};

	// Initialize the console
	doTag(console);

	function doTag (tagged, tag) {
		tagged.log = maplevel(null, 0, tag);
		tagged.warn = maplevel("WARNING", 1, tag);
		tagged.info = maplevel("INFO", 2, tag);
		tagged.error = maplevel("ERROR", 0, tag);
		tagged.debug = maplevel("DEBUG", 3, tag);

		var fatalLog = maplevel("FATAL", 0, tag);
		tagged.fatal = function () {
			fatalLog.apply(this, arguments);
			// NB. this generates a Java Null pointer exception if called
			// in a try catch. cf. PMR 51649,999,706
			Exit();
		}

		return tagged;
	}

	function log () {
		var msg = nciutils.format( _.toArray(arguments) );
		Log( 0, msg );
		return msg;
	}

	/**
		Map the console message type to Netcool/Impact log level

		@param {String} prepended to the message
		@param {Number} Netcool/Impact log level
		@return {Function} log function
	 */
	function maplevel (id, level, tag) {
		if (!id && !tag) return log;

		var pre = id
				? id + ": " + (tag || "")
				: tag

		return function () {
			var args = _.toArray(arguments);
			if (typeof args[0] === 'string') {
				args[0] = pre + args[0];
			} else {
				args.unshift(pre);
			}
			var msg = nciutils.format(args);
			Log( level, msg );
			return msg;
		}
	}

	// Detect if it was require'ed
	if (
			typeof exports === "object" && exports
		&&	typeof module === "object" && module
		&&	module.exports === exports
	) {
		module.exports = console;
	} else {
		// Expose as a variable
		root.console = console;
	}

})(this)