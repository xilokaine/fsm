;(function (root) {

        /**
            Si l'alerte n'est pas une CAUSE, Retourne NULL
            Si l'alerte est une CAUSE avec des CONSEQUENCES, Retourne une liste de "ServerName.ServerSerial" des alertes CONSEQUENCES et la Severity max des CONSEQUENCES
            Si l'alerte est une CAUSE sans CONSEQUENCE, Retourne une liste vide et une Severity a zero
            
            @params {Object} EventContainer : l'alerte à évaluer            
         */
         
         function  find_root_cause (ev) {
         
         var tag = "[FIND_ROOT_CAUSE]";
        // Remove OrgNode things
        var eV_dataitem = _.omit(ev, ['Name', 'Key', 'TypeName', 'Links', 'OrgNodeID', 'OperatorActions']);            

        // Recuperation des filtres CAUSE        
        var dataItems = nciutils.execSql(
            "EventrulesDB2"
        ,    "SELECT * FROM EVENTRULES"
        );        
        
        var numEventRules = dataItems.length;
        
        console.log("%s %s Rules", tag, numEventRules);

        if( numEventRules > 0 ) {
            var count = 0;
            var eventRuleItems = dataItems;
            var conseqFound = 0;
            var listConseq = [];
            var maxSeverity = 0;            
            var objToReturn = {};
            // Test des filtres CAUSE
            while( count < numEventRules ) {
            
                var myFiltre = eventRuleItems[count].EVENTRULE;
                var myEval = Eval(myFiltre, eV_dataitem);

                console.log("%s Filtre CAUSE : %s", tag, myFiltre);
                
                if (myEval == true) {
                    // CAUSE found !!
                    var filtreConseq = eventRuleItems[count].RELATEDEVENTQUERY;
                    var timeWindow   = eventRuleItems[count].TIMEWINDOWINSECONDS;

                    console.log("%s CAUSE !!! CAUSE !!! : %s", tag, eventRuleItems[count].RULENAME);
                    console.log("%s Filtre CONSEQUENCE : %s", tag, filtreConseq);
                    console.log("%s Time Window : %s", tag, timeWindow);
                    
                    // Recherche des consequences
                    
                    // Get eic_utils package
                    var eic_utils = require("/nrb/eic/eic_utils");

                    // Traitement des parametres
                    var valuedFilter = eic_utils.replaceParam(eV_dataitem, filtreConseq);
                
                    // Prendre en compte la timeWindow
                    valuedFilter = eic_utils.addSqlTimeWindow(eV_dataitem, valuedFilter, timeWindow);
                    console.log("%s FINAL FILTER : %s", tag, valuedFilter);
                
                   // var eventConseqItems = nciutils.execSqlFilter(
                   //     "EIC_alertquery"
                   // ,    
                   // );                                
        var eventConseqItems = nciutils.execSql(
             "EIC_alertsdb"
        ,    "SELECT * from alerts.status where "+valuedFilter
        );        
                    console.log("%s Nb alertes CONSEQUENCE : %s", tag, eventConseqItems.length);                                

                    if ( eventConseqItems.length > 0) {
                        // Construction de la liste des Consequences
                        _.each(eventConseqItems, function(key) {
                            var conseqID = key.ServerName + "." + key.ServerSerial;
                            
                            // Mise a jour de l'alerte
                            // ==> Fait dans Machine a etats
                            listConseq.push(conseqID);
                            console.log("%s CONSEQ : %s", tag, conseqID);
                            if ( key.Severity > maxSeverity) {
                                maxSeverity = key.Severity;
                            }
                        });                        
                                            
                        // Flag one or more CONSEQUENCE found
                        conseqFound = 1;

                        // Break the loop
                        count = numEventRules;
                    }
                } // myEval
                count = count + 1;
            } //While numEventRules
            
            if (conseqFound) {
                objToReturn["conseqs"] = listConseq;
                objToReturn["maxSeverity"] = maxSeverity;
                return objToReturn;
            }
            
            //CAUSE NOT FOUND
            if (count >= numEventRules) {
                // Ce n'est pas une CAUSE
                console.log("Pas une cause");
                return null;
            }
        }
    }
    module.exports = find_root_cause;

})(this)  
