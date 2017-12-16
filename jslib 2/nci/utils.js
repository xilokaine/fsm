/**
	Javascript utilities for Netcool/Impact
	Loaded external libraries:
	1. underscore.js
	2. json2.js

	getEventReader(eventContainer {Object} | datasource {String})
	getEventDataSource(eventContainer {Object})
	memottl(fn {Function}, id {String}, interval {Number})
	getPolicyLogger(property {String})
	execSql(eventContainer|DataSource {Object|String}, [escaper {Function},] sql {String}, [parameters])
	execSqlFilter(DataType {String}, [escaper {Function},] sql {String}, [parameters])
	execSqlInsert(DataType {String}, [escaper {Function},] data {Object}, [parameters])
	stringify(data {Object}) stringify an object (JS or Impact)
	format(args {Array}) first array item is the formatting string
 */
// Load Underscore
// Load("/lib3p/underscore");
// Replace underscore with a clone to avoid some Rhino random bug failing the processing
// Load("/lib3p/lodash.underscore");
Load("/nci/require");
var _ = require("/lib3p/lodash.underscore");

;(function (root) {
	var memottlCache = {};

	// Map Netcool/Impact types
	var nciTypes = {
			"JavaScriptScriptableWrapper":		"object"		// {}
		,	"EventContainer":					"object"		// {}
		// Enable to properly detect event reader objects when PMR 51787 is resolved
		// ,	"GenericEventReader":				"object"		// {}
		// ,	"ObjectServerEventContainer":				"object"		// {}
		,	"Object;":							"array"			// []
		,	"TypeOrgNode":						"OrgNode"
		,	"SQLOrgNode":						"OrgNode"
		,	"OrgNode$LinkManipulatorGetter":	"OrgNode"
		,	"VarGettableEnumeration":			"enumeration"
		,	"VarGetSettable;":					"array"
		,	"NativeError":						"object"
		,	"String":							"string"
		,	"Null":								"Null"
		};
	function typeOf (val) {
		return nciTypes[ ClassOf(val) ];
	}
	//TODO: PMR 51787,999,706 remove when it is fixed
	// ***DO NOT ENABLE*** as this produces a massive memory leak
	// Restore Object.prototype.toString to normal Javascript behaviour
	// as it breaks external js libs
	// Object.prototype.toString = function (val) {
	// 	val = val || this;
	// 	if (val === Object.prototype) return "[object Object]";

	// 	switch ( typeofSafe(val) ) {
	// 		case "number":
 //      			return "[object Number]"
 //      		case "boolean":
 //      			return "[object Boolean]"
 //      		case "function":
 //      			return "[object Function]"
 //      			// return "[object RegExp]"
 //      		case "string":
 //      			return "[object String]"
 //      		case "object":
 //      			// return "[object Date]"
 //      			// Quick and dirty way to identify an Array or Arguments
 //      			return val instanceof Array
 //      				? "[object Array]"
 //      				: ( typeof val.length !== "number"
 //      					? "[object Object]"
 //      					: (typeof val.push === "function"
 //      						? "[object Array]"
	// 						: "[object Arguments]"
 //      					)
 //      				)
 //      		default:
	// 			return "[object Object]";
	// 	}
	// }
	// Expose the commands
	var nciutils = {
		/**
			Get the DataSource from the current EventContainer or the given datasource
			ev {String|Object} datasource name or eventcontainer
		 */
		typeOf: typeOf
	,	getEventDataSource: memottl(
			function (ev) {
				if (!ev || typeof ev === "string") return ev;

				var evName = nciutils.getEventReader(ev);

				if (!evName) return false;

				// TODO work around random errors
				// return "AGG_V";

				//TODO open a PMR?
				var res = GetByKey("Service", evName);
				// Removing this results in the following random error:
				// InternalError: Java class "com.micromuse.common.util.Null" has no public instance field or method named "0".
				// Log("event reader lookup result: " + (typeof res) + " " + (res ? res.length : -1))
				// if ( !res || !res[0] ) {
				// 	Log("getEventDataSource: GetByKey returned %s", res);
				// 	return null;
				// }
				// Removing this results in the following random error:
				// JavaException: com.micromuse.common.util.NetcoolException: Data Source Command Failed. The property DataSource does not exist for this Service does not exist.
				// Log("event reader lookup data: " + res[0]);
				return res && res.length > 0 ? res[0].DataSource : false;
			}
		,	"EventReader.DataSource"
		,	3000
		)
	,	getEventReader: function (ev) {
			return !ev || typeof ev !== "object" || !_.has(ev, "EventReaderName")
				? false
				: ev.EventReaderName
		}
		// Dont pass interval to remove the cached entry
	,	memottl: memottl
	,	getPolicyLogger: memottl(
			function (key) {
				Log("GetByKey PolicyLogger...");
				var res = GetByKey("Service", "PolicyLogger");
				Log("GetByKey PolicyLogger done");
				Log("policy logger lookup result: " + ClassOf(res));
				Log("res " + (res ? res.length : -1));
				return res && res[0] ? res[0][key] : false;
			}
		,	"PolicyLogger"
		,	3000
		)
		// if param1 is an array, it is treated as the list of all parameters
		// The escape function for strings can be supplied as the second parameter
	// Netcool/Impact parameterized DirectSQL
	// Warning: by default, strings are **automatically** escaped using nciutils.escape.default
	,	execSql: function (ev, /*escaper,*/ sql /*param1, ...*/) {
			return execSql.call(
					null
				,	DirectSQL
				,	nciutils.getEventDataSource(ev)
				,	_.toArray(arguments).slice(1)
				);
		}
	// Netcool/Impact parameterized GetByFilter
	,	execSqlFilter: function (dataType, /*escaper,*/ sql /*param1, ...*/) {
			return execSql.call(
					null
				,	GetByFilter
				,	dataType
				,	_.toArray(arguments).slice(1)
				);
		}
	/**
		Netcool/Impact sql insert

		@param {String} data source
		@param {String} full table name (db + table)
		@param {Function} escaper applied to row values (optional)
		@param {Object} { field1: value1, field2: value2... }
		...
	 */
	,	execSqlInsert: function (ev, table, /*escaper,*/ obj /* obj2... */) {
			var tag = "DirectSQL: ";
			// List of rows to be inserted defined as objects
			var list = _.toArray(arguments);

			// Set the escaper
			var escaper = escapeAndQuoteStringSql;
			if (typeof obj == "function") {
				escaper = obj;
				list = list.slice(3);
			} else {
				list = list.slice(2);
			}

			// Log sql statement?
			var logSql = nciutils.getPolicyLogger("LogAllSQLStatements");

			var res = _.map(list, function (o) {
				var res;
				var sql = format([
							"insert into %s (%s) values (%s)"
						,	table
						,	_.keys(o).join(",")
						,	_.map(o, escaper).join(",")
						])

				if (logSql) Log(tag + sql);

				try {
					res = DirectSQL(
							nciutils.getEventDataSource(ev)
						,	sql
						,	false
						);
				} catch (e) {
					Log(tag + "ERROR: " + String(e));
					// Log the sql that failed if not already done
					if (!logSql) Log(tag + sql);
					res = e;
				}

				return res;
			});

			return res;
		}
	// Convert a Netcool/Impact object to JSON
	,	stringify: stringify
	// Process a formatting string
	,	format: format
	,	escape: { "default": escapeStringSql, "oracle": escapeStringSqlOracle }
	,	OrgNodeToJSON: function (o) {
			return _.omit(
						o
					,	"Name", "Key", "TypeName", "Links", "OrgNodeID", "OperatorActions", "ACTIONTREELINKTYPES"
					)
		}
	};

	function memottl (fn, id, interval) {
		if (arguments.length === 2) {
			// Remove the id
			delete memottlCache[id];
			return;
		}
		if ( memottlCache.hasOwnProperty(id) )
			throw new Error("memottl: id '" + id + "' already in use");

		var cache = memottlCache[id] = {};

		function memo (key) {
			var item = cache[key];
			var now = Date.now();

			if ( !item ) {
				// Not cached yet
				item = cache[key] = { value: fn(key), last: now };
			} else if ( item.last < now - interval ) {
				// Cached but expired
				item.value = fn(key);
				item.last = now;
			}

			return item.value;
		}

		// Keep a reference to the original parameters
		memo.memottl = _.toArray(arguments);

		return memo;
	}

	function execSql (fn, source, args) {
		var tag = fn.name + ": ";
		var res;
		// Valid source?
		if (!source) {
			res  =[];
			res.error = "Invalid datasource: " + source;
			Log(tag + "ERROR: " + res.error);
			return res;
		}

		// Log sql statement?
		var logSql = nciutils.getPolicyLogger("LogAllSQLStatements");

		// Escape strategy for strings?
		var escaper = typeof args[0] === "function"
			? args.shift()
			: nciutils.escape["default"]
			;
		var sql = args[0];

		if (args.length > 1) {
			// Parameterized sql query
			// var params = _.isArray( args[1] )
			// 	? args[1].map(escaper)
			// 	: args.slice(1).map(escaper)
			// 	;
			var params = args.slice(1).map(escaper);

			sql = format( [sql].concat(params) );
		}

		if (logSql) Log(tag + sql);

		try {
			res = fn( source, sql, false );
		} catch (e) {
			Log(tag + "ERROR: " + String(e));
			// Log the sql that failed if not already done
			if (!logSql) Log(tag + sql);
			res = [];
			// Attach the error to the result
			res.error = e;
		}

		return res;
	}

	/**
		Escape functions
	 */
	// Safe typeof
	function typeofSafe (v) {
		try {
			return typeof v;
		} catch (e) {}
		return "unknown";
	}
	var quoteEscapeRex = /\'/g;
	var backslashEscapeRex = /\\/g;
	function escapeStringSql (v) {
		return typeof v === "string"
			? v
				.replace(backslashEscapeRex, "\\\\")
				.replace(quoteEscapeRex, "\\'")
			: v
	}
	// Escape single quotes for Oracle
	function escapeStringSqlOracle (v) {
		return typeof v === "string"
			? v
				.replace(backslashEscapeRex, "\\\\")
				.replace(quoteEscapeRex, "''")
			: v
	}

	/**
		Helpers
	 */
	function escapeAndQuoteStringSql (val) {
		return typeof val === "string"
			? "'" + escapeStringSql(val) + "'"
			: val
	}

	/**
		Process a formatting string

		@param {Array} list of arguments to be processed. The first one is the formatting string
		@return {String} formatted string
	 */
	var formatRex = /%[sdjo%a]/g;
	function format (args) {
		var f = args[0];
		if (typeof f !== 'string') return args.map(showUndefined);

		// Process the first string as a template
		var i = 1;
		var n = args.length;
		args[0] = String(f).replace(
			formatRex
		,	function (c) {
				if ( i >= n ) return c;
				switch (c) {
					case '%%': return '%';
					case '%s': return String( args[i++] );
					case '%d': return parseInt( args[i++], 10 );
					case '%b': return parseInt( args[i++], 10 ).toString(2);
					case '%x': return '0x' + parseInt( args[i++], 10 ).toString(16);
					case '%j': return stringify( args[i++] );
					case '%o': return stringify( args[i++] );
					case '%a': return arrayToString( args[i++] );
					default: return c;
				}
			}
		);

		// All arguments used, return the formatted string
		if (n === i) return args[0];

		// Remove arguments used in the template
		args.splice(1, i-1);

		return args;
	}
	function showUndefined (v) {
		return _.isUndefined(v) ? "undefined" : v;
	}

	function arrayToString (arr) {
		return !_.isArray(arr) && typeOf(arr) !== "array"
			? escapeAndQuoteStringSql( String(arr) )
			: _.map( arr, escapeAndQuoteStringSql ).join(",")
	}

	function objectToString (o, level, objFound) {
		// Discard arguments, date objects
		if ( _.isDate(o) || _.isArguments(o) ) return "undefined";

		// Process the object, array or real object
		var isArray = _.isArray(o);
		var res = [];

		if (level > 0) {
			// Use _.each(_.keys) instead of _.each() to avoid lodash failing on non js objects
			var keys = _.keys(o);
			_.each(keys, function (k) {
				var v = stringify( o[k], level, objFound );
				res.push( isArray ? v : k + ":" + v );
			});
		}

		return (isArray ? "[" : "{")
			+ res.join(",")
			+ (isArray ? "]" : "}")
	}

	/**
		Stringify anything
	 */
	function stringify (val, level, objFound) {
		if (arguments.length < 2) level = 8;
		objFound = objFound || [];

		if (val instanceof Error) return String(val);

		switch ( typeofSafe(val) ) {
			case "function":
				// Discard functions
				return "undefined";

			case "object":
				// Only check for cyclic references on pure JS objects
				if ( _.indexOf(objFound, val) >= 0 ) return "undefined";
				objFound.push(val);

			case "unknown":
				// Impact object
				var internalType = typeOf(val);
				if (!internalType) {
					// Unmapped Impact object, treat it as a string
					Log("ERROR: Unknown ClassOf: " + ClassOf(val));
					return "'" + escapeStringSql( String(val) ) +"'";
				}

				// Data item
				if (internalType === "OrgNode")
					// Remove Impact internal fields 
					return objectToString(
							nciutils.OrgNodeToJSON(val)
						,	--level
						);

				if (internalType === "array") return objectToString(val, --level);

				// Null
				if (internalType === "Null") return "Null";

				// List - found on Impact data type OrgNodes
				if (internalType === "enumeration")
					return objectToString( _.compact( String(val).split("\n") ), --level );

				return objectToString(val, --level, objFound);

			case "string":
				return "'" + stringifyUTF8(val) + "'";

			default:
				return val;
		}
	}

	function stringifyUTF8 (o) {
		var i = 0;
		var oo = [];
		while (i < o.length) {
			var c = o.charCodeAt(i);
			if (c < 32) {
				c = c.toString(16);
				if (c.length < 2) c = '0' + c;
				oo.push( '\\x' + c );
			}
			else if (c === 39) { // '
				oo.push( "\\'" );
			}
			else if (c === 92) { // \
				oo.push( '\\\\' );
			}
			else {
				oo.push( o[i] );
			}
			i++;
		}
		return oo.join("");
	}

	root.nciutils = nciutils;

})(this)