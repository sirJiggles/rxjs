// lets make it from scratch!!!

function Observable(forEach) {
  this._forEach = forEach
}

Observable.prototype = {
  forEach: function(onNext, onError, onCompleted) {
    if (typeof arguments[0] === "function") {
      // then they are passing in functions as first arg
      // so just call for each
      return this._forEach({
        onNext: onNext,
        onError: onError || function() {},
        onCompleted: onCompleted || function() {}
      })
    } else {
      // other option is they pass is an observable here so we 
      // just pass ot along
      return this._forEach(onNext)
    }
  },
  // map is just like with array but with the full API of observerbles
  map: function(projectionFunction) {
    var self = this;
    return new Observable(function forEach(observer) {
      //  dont forget for each returns the subscription which we can dispose on
      return self.forEach(
        // on nexts can throw, but for the sake of simplicity, we wont try catch here and call on error
        function onNext(x) { return observer.onNext(projectionFunction(x)) },
        function onError(err) { return observer.onError(err) },
        function onCompleted() { return observer.onCompleted() }
      )
    })
  },
  filter: function(predicateFunction) {
    var self = this;
    return new Observable(function forEach(observer) {
      return self.forEach(
        function onNext(x) {
          // only call if 
          if (predicateFunction(x)) {
            observer.onNext(x);
          }
        },
        function onError(err) { return observer.onError(err) },
        function onCompleted() { return observer.onCompleted() }
      )
    })
  },
  // take will take until max number and dispose of the subscription
  take: function(amount) {
    var self = this
    return new Observable(function forEach() {
        var count = 0
        var subscription = self.forEach(
            function onNext(x) { 
                return observer.onNext()
                count ++
                if (count === amount) {
                    // now call the subscription handlers no more data function
                    // after the right amount of on next's
                    subscription.dispose()
                    // as we never get another message from this guy
                    // we need to tell the observer we are done
                    observer.onCompleted()
                }
            },
            function onError(err) { return observer.onError(err) },
            function onCompleted() { return observer.onCompleted() }
        )
        return subscription
    })
  }
}


// here we define the fromEvent API, tots easy peasy
Observable.fromEvent = function(domElement, eventName) {
  return new Observable(function forEach(observer) {
    var handler = (e) => { observer.onNext(e) }

    domElement.addEventListener(eventName, handler)

    return {
      dispose: () => {
        domElement.removeEventListener(eventName, handler)
      }
    }
  })
}


// lets use our custom click event
var btn  = document.getElementById('button')

// var clicks = Observable.fromEvent(btn, 'click')

// clicks.forEach((e) => console.log(e.pageX))


// =================== STEP ===============


// var clicks = Observable
//                 .fromEvent(btn, 'click')
//                 // using our custom  filter expression!
//                 .filter((e) => e.pageX > 30)
//                 // using our custom  map expression!
//                 .map((e) =>  e.pageX + 'px')

// clicks.forEach((e) => console.log(e))


// =================== STEP ===============


