/**
  Provide ObjectServer event based logging
  Log.details(EventContainer, name, value)
  Log.journals(EventContainer[, uid], message[, params])
 */
// Utils
Load("/nci/utils");

// Extend the Log() command
;(function (root, nciLog) {
	var ncoutils = require("/nci/nco");

	// Expose the Log command
	root.Log = nciLog;

	// Seed for the details sequence
	var detailsSerial = Date.now();

	// Tag used to identify detail entries coming from Log.details
	var keyTag = "Log.details";

	// EventContainer changes from call to call and the library is cached...
	/**
		Add a detail entry to the given event
		Remove all details matching the name regexp if no value is given
		
		@param {Object} ObjectServer event object
		@param {String} name for the detail token or last sequence
		@param {String} value for the detail token or id used to remove entries
		@param {String} id inserted to the KeyField (default=)
	 */
	nciLog.details = function (EventContainer, name, value, id) {
		var keyField = keyTag + ":" + EventContainer.ServerName + "." + EventContainer.ServerSerial + ":";

		// Remove details?
		// NB. this query is ***slow*** and will spike the ObjectServer if many details
		if (arguments.length === 3) {
			return nciutils.execSql(
				EventContainer
			,	"delete from alerts.details where Sequence<%d and KeyField like '^%s%s';"
			,	keyField
			,	name	// sequence
			,	value	// id
			);
		}

		// The sequence is set using the current time (in ms) and a random seed (unique per nci_log load)
		// The detail key field is set using a hashed value of the Identifier and the sequence
		// This should make it unique in all cases, hence making Log.details thread-safe
		var sequence = Date.now();

		return nciutils.execSql(
			EventContainer
		,	"insert into alerts.details (KeyField,Identifier,AttrVal,Sequence,Name,Detail) values ('%s%s:%d:%d','%s',%d,%d,'%s','%s');"
		,	keyField
		,	id
		,	detailsSerial++
		,	sequence
		,	EventContainer.Identifier
		,	1
		,	sequence
		// Make sure we dont exceed the field sizes to avoid warning messages
		,	name.substr(0, 255)
		,	value.substr(0, 255)
		);
	}
	
	/**
		Add a journal entry to the given event
		
		@param {Object} ObjectServer event object
		@param {Number} user id to be used (optional) (default value from the event)
		@param {String} journal message (parameterizable)
	 */
	nciLog.journals = function (EventContainer, uid, msg/*, params */) {
		var args = _.toArray(arguments).slice(2);

		// Invalid uid, pick the one from the event
		if (typeof uid !== "number") uid = EventContainer.OwnerUID;

		return nciutils.execSql(
			EventContainer
		,	"execute jinsert(%d,%d,getdate,'%s');"
		,	EventContainer.Serial
		,	uid
		,	nciutils.format(args)
		);
	}

})(this, Log)