;(function(){

console.log("We start with bind apply and call method")

var test = false





var t = [1,2,3]
console.log(typeof(t))




var myObject = {
    
     crazyMessage: 'gouzigouza',
    
     doSomethingCrazy: function() {
       console.log(this.crazyMessage);
     },   


     
     doSomeAsyncCrazyness: function() {
          console.log(this.hasOwnProperty('doSomethingCrazy'))
         setTimeout(function() {

            this.doSomethingCrazy();
    }.bind(this), 1000);
    
  }
 };
 
    

 myObject.doSomeAsyncCrazyness();
console.log(test)
})()
console.log("prog ended")
console.log(test)
var test = "salut"