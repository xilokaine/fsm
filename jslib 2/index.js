

;(function(){

//adapth the path whith rhino and change Load by load
let path = '/Users/paulmartinez/Documents/FSM_STET/jslib 2'
load(path + "/nci/require.js");


var _ = require (path + "/lib3p/lodash.underscore.js")
var moment = require (path + "/lib3p/moment.js")


function ev (name,filter){
    this.name = name 
    this.filter = filter
    this.startTime = ""
    this.endTime = ""

    this.setfilter = function (filter) {
            this.filter = filter
            print ("the filter is " + this.filter);
        }

    
    return this
}


var ev1 = new ev("test")


}(this));
