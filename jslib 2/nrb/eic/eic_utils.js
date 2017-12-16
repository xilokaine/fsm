/**
	Various utility functions for Event Correlation
 */

Load("/lib3p/lodash.underscore");

Load("/nci/require");

;(function (root) {

	module.exports = {
		/**
			Retourne le filtre filterCONSEQ modifie avec les paramatres subtitues par les valeurs des champs de l'alerte ev
			@params {Object} EventContainer
			@params {String} Filter
		 */
		replaceParam: replaceParam

		/**
			Retourne le filtre filterCONSEQ modifie avec les paramatres subtitues par les valeurs des champs de l'alerte ev
			@params {Object} EventContainer
			@params {String} Filter
			@params {Number} timeWindow in seconds
		 */
		, addSqlTimeWindow: addSqlTimeWindow		
	}

	// Retourne le filtre filterCONSEQ modifie avec les criteres de fenetre temporelle
	function addSqlTimeWindow (ev, filterCONSEQ, timeWindow) {
			var valuedFilter = filterCONSEQ;
			var startTime = ev.LastOccurrence - timeWindow;
			var endTime = ev.LastOccurrence + timeWindow;
			valuedFilter = valuedFilter + ' AND LastOccurrence >= ' + startTime + ' AND LastOccurrence <= ' + endTime;			
			return valuedFilter;
	}	
	
	// Retourne le filtre filterCONSEQ modifie avec les paramatres subtitues par les valeurs des champs de l'alerte ev
	function replaceParam (ev, filterCONSEQ) {
		var rex = /(@\w+@)/g;
		var valuedFilter = filterCONSEQ;
		_.each(filterCONSEQ.match(rex), function (key) {
			var field = key.slice(1, -1);
			if ( _.has(ev, field) ) valuedFilter = valuedFilter.replace(key, ev[field]);
		});

		// Exclure de l'alerte CAUSE du filtre CONSEQUENCE
		return valuedFilter + " AND ServerSerial <> " + ev.ServerSerial;
	}	
})(this)