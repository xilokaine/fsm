;(function(){

    let path = '/Users/paulmartinez/Documents/FSM_STET/jslib 2'
    load(path + "/nci/require.js");
    var _ = require (path + "/lib3p/lodash.underscore.js")

var console = {
    log: function(a) {
        print(a)
    }
}

//lead the cascade callback

console.log("We start with bind apply and call method")


//load 10 events in pool
var buildevents = new Array(10);
console.log(buildevents.length)

var t = 
    {

     b : function (call) { _.each(buildevents, function(val, i, array){
            console.log(i)
            buildevents[i] = {
                Node : 'Node_' + i,
                AlertKey: 'AlertKey_' + i,
                AlertGroup: 'AlertGroup_' + i, 
                msg: 'msg' + i
            }
            return buildevents
        })
        return call(buildevents)
    }
    }

function call(a){
    //a contains 10 events
    print(a[0].Node)
    print(typeof(a[0]))

    var b = {
        Node : 'N1',
        AlertKey : 'A1',
        AlertGroup : 'G2',
        msg : 'msg2'
    }
    //print (Eval(a[0],b))
    var check = _.compareAscending(b, a[0])
    

}


//manage code with callback



console.log('Display t')
t.b(call)

console.log(' t displayed')
return

var event = new Array;

event[1] = {
    Node : "Node1",
    AlertKey : "key1",
    AlertGroup : "Group1"
}



event.forEach(function(v,i,a){
    console.log(i)
})


console.log(event[1])



var test = false



var t = [1,2,3]
console.log(typeof(t))




// var myObject = {
    
//      crazyMessage: 'gouzigouza',
    
//      doSomethingCrazy: function() {
//        console.log(this.crazyMessage);
//      },   
     
//      doSomeAsyncCrazyness: function() {
//           console.log(this.hasOwnProperty('doSomethingCrazy'))
//          setTimeout(function() {

//             this.doSomethingCrazy();
//     }.bind(this), 1000);
    
//   }
//  };
 

// myObject.doSomeAsyncCrazyness();
// console.log(test)
})()


// console.log("prog ended")
// console.log(test)
// var test = "salut"






