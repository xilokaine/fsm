# FSM 
FSM Light 

```A new project of final state machine.```

![](https://raw.githubusercontent.com/jakesgordon/javascript-state-machine/HEAD/examples/matter.png)

**Finite state machines** are a great conceptual model for many concerns facing developers – from conditional UI, connectivity monitoring & management to initialization and more. State machines can simplify tangled paths of asynchronous code, they're easy to test, and they inherently lend themselves to helping you avoid unexpected edge-case-state pitfalls. machina aims to give you the tools you need to model state machines in JavaScript, without being too prescriptive on the problem domain you're solving for.



```
const fsm = require('fsm')


const MyApp = new fsm()


MyApp.createState('firstStep')
MyApp.createState('secondStep')

MyApp.createTransition('first2second')

```


