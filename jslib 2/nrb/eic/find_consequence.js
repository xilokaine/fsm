
;(function (root) {

    /**
        Si l'alerte n'est pas une CONSEQUENCE, Retourne false
        Si l'alerte est une CONSEQUENCE, Retourne le "ServerName.ServerSerial" de l'alerte CAUSE 
        
        @params {Object} EventContainer : l'alerte à évaluer            
     */    
    function  find_consequence (ev) {

        var tag = "[FIND_CONSEQUENCE]";    
        var eV_dataitem = _.omit(ev, ['Name', 'Key', 'TypeName', 'Links', 'OrgNodeID', 'OperatorActions']);

        // Recuperation des filtres CAUSE
        var dataItems = nciutils.execSql(
            "EventrulesDB2"
        ,    "SELECT * FROM EVENTRULES"
        );    
        
        var numEventRules = dataItems.length;
        console.log("%s %s Rules", tag, numEventRules);        

        // Construction filtre toutes les CAUSES
        if( numEventRules > 0 ) {
            var count = 0;
            var eventRuleItems = dataItems;
            
            var allCauseFilter = eventRuleItems[count].EVENTRULE;
            count = count + 1;            
            
            while( count < numEventRules ) {
                allCauseFilter = "( " + allCauseFilter + " ) or ( " + eventRuleItems[count].EVENTRULE + " )";    
                count = count + 1;
            }
            console.log("%s allCauseFilter :%s", tag, allCauseFilter);            
            
            // Recuperation des toutes les alertes CAUSE
            var dataItems = nciutils.execSql(
             "EIC_alertsdb"
        ,    "SELECT * from alerts.status where "+allCauseFilter
        );
                
            var numEventCause = dataItems.length;
            console.log("%s %s CAUSES match", tag, numEventCause);        
            
            if( numEventCause > 0 ) {
                var eventCauseItems = dataItems;
                var iCause = 0;
                var isConseq = 0;
                var rcID = '';

                console.log("%s \n NB ALERTS : %s, NB RULES : %s", tag, numEventCause, numEventRules);        
                
                // Traitement alerte CAUSE par alerte CAUSE
                _.some(eventCauseItems, function(xCause) {
                    // Traitement EVENTRULE par alerte CAUSE

                    // Remove OrgNode things
                    var evCause = _.omit(xCause, ['Name', 'Key', 'TypeName', 'Links', 'OrgNodeID', 'OperatorActions']);

                    _.some(eventRuleItems, function(xRule) {
                        console.log("%s Filtre CAUSE a tester : %s | Node : %s", tag, xRule.EVENTRULE, evCause.Node);                            
                        var evalCause = Eval(xRule.EVENTRULE, evCause);
                    
                        console.log("%s evalCause : %s", tag, evalCause); 
                    
                        if (evalCause == true) {
                            // Treating CAUSE !!
                            console.log("%s Treating CAUSE", tag); 

                            var filtreConseq = xRule.RELATEDEVENTQUERY;
                            var timeWindow   = xRule.TIMEWINDOWINSECONDS;
                        
                            // Get eic_utils package
                            var eic_utils = require("/nrb/eic/eic_utils");

                            // Traitement des parametres
                            var valuedFilter = eic_utils.replaceParam(evCause, filtreConseq);
                                
                            // Prendre en compte la timeWindow
                            valuedFilter = eic_utils.addSqlTimeWindow(evCause, valuedFilter, timeWindow);
                    
                            console.log("%s =================", tag);                             
                            console.log("%s valuedFilter : %s", tag, valuedFilter); 
                            console.log("%s =================", tag);                             
                            // Evaluer le filtre CONSEQUENCE avec l'alerte en cours
                            var evalConseq = Eval(valuedFilter, eV_dataitem );
                            if (evalConseq == true) {
                                // L'alerte en cours est CONSEQUENCE !!!
                                
                                console.log("%s CONSEQUENCE !!! CONSEQUENCE !!! : %s", tag, xRule.RULENAME);
                                console.log("%s L'ALERTE CAUSE est %s", tag, evCause.ServerName+'.'+evCause.ServerSerial);
                                
                                // It is a CONSEQUENCE, break the loop
                                isConseq = 1;
                                rcID = evCause.ServerName + '.' + evCause.ServerSerial;
                                
                                // Mise a jour EventContainer d'origine (la CONSEQUENCE)
ev.BSM_Identity = rcID;
                                
                                // La Severity CAUSE mise a jour si la Severity CONSEQUENCE est superieure
                                /*
                                if ( eV_dataitem.Severity > evCause.Severity) {
                                    // Attention il faut mettre a jour l'OrgNode xCause et non evCause
                                    xCause.Severity = eV_dataitem.Severity;
                                }
                                */
                                // ==>> Fait dans la Machine a etats                                
                                return true;
                            }
                        }                
                    });
                    if (isConseq) {
                        // It is a CONSEQUENCE, break the loop
                        return true;
                    }
                });    

                if ( isConseq ) {
                    // It is a CONSEQUENCE, return ID of the CAUSE
                    return rcID;
                }
                else {
                    // It is not a CONSEQUENCE, return false
                    return false;
                }    
            }
        }
    }
    module.exports = find_consequence;

})(this)  
