/**
	Various utility functions for Netcool Omnibus
 */
Load("/nci/utils");

;(function (root) {

	var nco = {
		/**
			Get the uid for a given user name
			@params {String|Number} user name or id
			@params {String} ObjectServer data source
			@return {Number|Array|null} user id, [].error, not found
		 */
		getUid: getUid
		/**
			Get the gid for a given user name
			@params {String|Number} group name or id
			@params {String} ObjectServer data source
			@return {Number|Array|null} group id, [].error, not found
		 */
	,	getGid: getGid
		/**
			Fetch the groups for a given user
			@params {String|Number} user name or id
			@params {String} ObjectServer data source
			@params {Boolean} do not filter out internal groups
			@return {Array}
		 */
	,	groupsFromUser: groupsFromUser
		/**
			Fetch the users for a given group
			@params {String|Number} group name or id
			@params {String} ObjectServer data source
			@params {Boolean} do not filter out internal groups
			@return {Array}
		 */
	,	usersFromGroup: usersFromGroup
		/**
			Fetch the users for a given group
			@params {String|Number} group name or id
			@params {String} ObjectServer data source
			@params {Boolean} do not filter out internal groups
			@return {Array}
		 */
	,	groups: groups
		/**
			Fetch the users for a given group
			@params {String|Number} group name or id
			@params {String} ObjectServer data source
			@params {Boolean} do not filter out internal users
			@return {Array}
		 */
	,	users: users
		/**
			Check if the user has admin rights
			@params {String|Number} user name or id
			@params {String} ObjectServer data source
			@return {Boolean}
		 */
	,	isAdmin: isAdmin
	}

	function isAdmin (id, datasource) {
		var uid = getUid(id, datasource);

		if (typeof uid !== "number") return false;

		// List of nco groups for the user
		var nco = nciutils.execSql(
			datasource
		,	"select GroupID from security.group_members where GroupID=1 and UserID=%d"
		,	uid
		);

		return nco.length > 0;
	}

	function groupsFromUser (id, datasource, keepInternal) {
		var uid = getUid(id, datasource);

		if (typeof uid !== "number") return uid;

		// List of nco groups for the user
		var nco = nciutils.execSql(
			datasource
		,		"select GroupName from security.groups where "
			+	excludeGroups(keepInternal)
			+	" and GroupID in ((select GroupID from security.group_members where UserID=%d))"
		,	uid
		);

		return nco.error
			? nco
			: _.pluck(nco, "GroupName")
	}

	function usersFromGroup (id, datasource, keepInternal) {
		var gid = getGid(id, datasource);

		if (typeof gid !== "number") return gid;

		// List of nco users for the group
		var nco = nciutils.execSql(
			datasource
		,		"select UserName from security.users where "
			+	excludeUsers(keepInternal)
			+	" and UserID in ((select UserID from security.group_members where GroupID=%d))"
		,	gid
		);

		return nco.error
			? nco
			: _.pluck(nco, "UserName")
	}

	function groups (datasource, keepInternal) {
		// List of nco groups for the user
		return getAll(
			datasource
		,		"select GroupName as res from security.groups where "
			+ 	excludeGroups(keepInternal)
			+	" order by GroupName asc"
		)
	}

	function users (datasource, keepInternal) {
		// List of nco groups for the user
		return getAll(
			datasource
		,		"select UserName as res from security.users where "
			+	excludeUsers(keepInternal)
			+	" order by UserName asc"
		)
	}

	/**
		Helpers
	 */
	function getUid (id, datasource) {
		return getId(
				id
			,	datasource
			,	"select UserID as res from security.users where UserName='%s'"
			);
	}

	function getGid (id, datasource) {
		return getId(
				id
			,	datasource
			,	"select GroupID as res from security.groups where GroupName='%s'"
			);
	}

	function getId (id, datasource, sql) {
		if (typeof id === "number") return id;
		
		// Get the id from the name
		var _id = id;
		// Get the id from its name
		var nco = nciutils.execSql(
				datasource
			,	sql
			,	id
			)
		;

		return nco.error ? nco : nco.length > 0 ? nco[0].res : null
	}

	function getAll (datasource, sql) {
		// List of nco groups for the user
		var nco = nciutils.execSql(
			datasource
		,	sql
		)
		;

		return nco.error
			? nco
			: _.pluck(nco, "res")
	}

	function excludeUsers (flag) {
		return flag
			? "1=1"
			: "UserName not in ('root','nobody')"
	}

	function excludeGroups (flag) {
		return flag
			? "1=1"
			: "GroupName not in ('Administrator','Gateway','ISQL','ISQLWrite','Normal','Probe','Public','System')"
	}

	// Detect if it was require'ed
	if (
			typeof exports === "object" && exports
		&&	typeof module === "object" && module
		&&	module.exports === exports
	) {
		module.exports = nco;
	} else {
		// Expose as a variable
		root.nco = nco;
	}

})(this)