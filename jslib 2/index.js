

;(function(){

//adapth the path whith rhino and change Load by load
let path = '/Users/paulmartinez/Documents/FSM_STET/jslib 2'
load(path + "/nci/require.js");


var _ = require (path + "/lib3p/lodash.underscore.js")
var moment = require (path + "/lib3p/moment.js")


//gogo


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


//ev1.setfilter('where node = bla')
//get date
var d = moment().format('DD MM YYYY, HH:mm:ss a');
//get epoch
var de = moment().unix();
//
print (de)
//convert epoch to date
print (moment.unix(de).format('DD MM YYYY HH:mm:ss Z'));
//convert date to epoch
var epoch = moment('11/11/2018 10:00:00', 'DD/MM/YYYY HH:mm:ss').unix()
print ("converted epoch " + epoch)

print (d)
print (de)

}(this));
