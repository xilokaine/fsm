

//load('require.js')

var _ = require('./lib3p/lodash.js')


//get all the events in the object server.
function getOS() {
    var base = new Array()

    base = [
    {
            Node : "node2",
            service: "service2"
        },
        {
            Node : "node5",
            service: "service1"
        }
    ]
    return base
}


//

var ev = new Object()
ev.Node = "node1"
ev.service ="service1"




//
var os = getOS()
//receive an event, begin processing.

_.each(os, function(i,d){
    if (ev.service == i.service){
        console.log(ev.Node + " Match and have the same service that " + i.service + " for " + i.Node)
    }
})













