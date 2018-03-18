var Observable = Rx.Observable;

// what collections do we have
var textBox = document.getElementById('search');
var searchResultsInput = document.getElementById('results')
// collection of keybpresses
var keypresses = Observable.fromEvent(textBox, 'keyup')

// subscribe to that data
// keypresses.forEach((e) => {
//   console.log(e.keyCode);
// //   searchWikipediaOb(e.target.innerText).forEach(keypresses)
// })

// This is a standard get function from wikipedia
// function searchWikipedia(term) {
//   var url = `http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(term)}&callback=?`;
//   $.getJSON(url, function(data) {
//     console.log(data);
//   });
// }

// searchWikipedia('bill gates');

// now we will get using observer!
function searchWikipediaOb(term) {
  return Observable.create(function(observer) {
    var canceled = false;
    var url = `http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(term)}&callback=?`;
    $.getJSON(url, function(data) {
      // in this case we just say, hey I dont care
      if (!canceled) {
        observer.next(data[1]);
        // only want one result
        observer.complete();
      }
    })

    // need to rerurn the subscription
    // and would be good if we could cancel the request?
    // but in this case ... we cant
    // most asyn libs. actually dont have the notion of cancel
    // so jquery here does not support it
    return {
      dispose: () => {
        canceled = true;
      }
    }
  })
}

// searchWikipediaOb('gsus').forEach(function(results) {
//   console.log(results);
// });

// ============== STEP ==============

// Now lets think about the stream we want, stream of all search results 
// sometimes helps to think backwards "what would I do with the data that comes out?"
// in this example show on screen as we will create a auto complete

// search results set (is infinate!)
// {...['ardvark', 'arnald'] ... ... ['about', 'abundance'] ....}

// lets use keypres, this is what we have right now
// {..... 'a' ..... 'b' .....}

// so first we can throttle to reduce the unrequired requests
// a ->           {..... a..b ...... c......d}
// a.throttle ->  {.........b...............d}

// then we could modify the stream using map

// so now we build WHAT WE WANT
// var searchResults = keypresses
//   // {..... a..b ...... c......e}
//   .throttleTime(20)
//   // {.........b...............e} 
//   .map((key) => {
//     console.log(key.target.value)
//     // this is the "Observable" of one
//     return searchWikipediaOb(key.target.value)
//   })
//   /*
//   At this stage we have a 2D map, so we will need to concatALL
//   {
//     ....... {...... ["better", "blocking"]}
//     ...........{................["benifit", "because"]}

//   }
//   now, this is diff between arrays, not only "how many flatterns do I need"
//   but "which shold I use!!"
//   as we have a collection of collections over time we can use one of the follwoing

//   - mergeAll
//   - concatAll
//   - switchLatest (This is the most common one to use for UI)

//   on merge all we would get, in the order they come in, like lanes on a motorway
//   {.....["better", "blocking"].........["benifit", "because"]}
  
//   on concatALL we would get the same 'order' but would not
//   call forEach on the next one until the prev was finished
//   so the time will be included but over a much longer time
//   {.....["better", "blocking"]................["benifit", "because"]}

//   on switch we get ONLY the last one
//   {..........................................["benifit", "because"]}
//   as we where waiting for the on next or on complete we got another 
//   network req and then called dispose, and started listening to the new one
//   THIS is how we can cancel network requests something that promises cannot do
//   AND there is no RACE CONDITION! some network requests might come back 
//   before others!
//   */
//   .switch()



// THEN call for each on WHAT WE WANT TO DO WITH IT!
// searchResults.forEach((resultSet) => {
//   console.log(JSON.stringify(resultSet))
//   searchResultsInput.value = JSON.stringify(resultSet)
// })


// ============== STEP ==============


// Lets improve with distinct until changed, because of left right
// arrow key issue
// var searchResultsClean = keypresses
//   // {..... a..b ...... c......e}
//   .throttleTime(20)
//   // {.........b...............e} 
//   .map((key) => {
//     return key.target.value;
//   })
//   // {........be.......}
//   .distinctUntilChanged()
//   .map((search) => {
//     // can retry 3 times, if there is a server error!!
//     return searchWikipediaOb(search).retry(3)
//   })
//   .switch()



// the retry behined the scenes does something like
// req = ob.forEach -> err
// count += 1
// if count < max
// req = ob.forEach -> err 
 
// and so on, this guy sits in the middle of two observables


// searchResultsClean.forEach(
//   (resultSet) => {
//     // console.log(JSON.stringify(resultSet))
//     searchResultsInput.value = JSON.stringify(resultSet)
//   })


// IF WE COULD HAVE ERROR IN JSONP, for example standard XHR
// searchResultsClean.forEach(
//   (resultSet) => {
//     // console.log(JSON.stringify(resultSet))
//     searchResultsInput.value = JSON.stringify(resultSet)
//   }, (err) => {
//     /*
//       if there is a network error, we bubble it up
//       this is the observable error bundling not the JS runtime
//       this is 100x better than nested callbacks as you can 
//       just grab the top lvl error rather than manually pushing it
//       up the pyramid! like in node JS

//       will also clean up after itself like when a try catch is thrown
//       and the stack is cleaned in JS runtime
      
//     */

    
//   })

// What about empty searches, lets not include those either
// var searchResultsCleanAndNotEmpty = keypresses
//   // {..... a..b ...... c......e}
//   .throttleTime(20)
//   // {.........b...............e} 
//   .map((key) => {
//     return key.target.value;
//   })
//   // {........be.......}
//   .distinctUntilChanged()
//   .filter((search) => {
//     return search.trim().length > 0
//   })
//   .map((search) => {
//     return searchWikipediaOb(search).retry(3)
//   })
//   .switch()

// searchResultsCleanAndNotEmpty.forEach((resultSet) => {
//   searchResultsInput.value = JSON.stringify(resultSet)
// })


// what about an auto complete that only shows under some cases?
// maybe it doesnt even exist yet?
// so click button, then show auto complete, then hide when click
// x, if this where dom, and removed you would still have it in
// memory. 

// so, lets create an observable for the button click to show it.
var searchButton = document.getElementById('searchButton')
var searchForm = document.getElementById('searchForm')

// click event
var searchButtonClicks = Observable.fromEvent(searchButton, 'click')

// ============== STEP ==============

// so what do we want to DO when this is clicked?
// ... show the form right?
// so when changing the dom use forEach... because when we CHANGE
// something, we always try to di in in forEeach, then you should
// be able to see all the EFFECTS in your app
// searchButtonClicks.forEach((e) => {
//   searchForm.style.display = 'block';

//   // when the form is visible THEN we will hook up the close button
//   // this could allow us to only have dome elements that exist when we
//   // need then making smaller memory footprints

// })

// now we can also be super smart and only hook up the search
// functionality AFTER the user clicked the search button so now 
// it can look like this

// var searchResultsCleanAndNotEmptyAfterClick = 
//   // the map here creates an ORDER, as it can only happen AFTER a click event

//   searchButtonClicks.map(() => {
//     // we will create the close btn Observer here as it could* be that showing the form actually
//     // creates the dom, so in this case we know that dom exists, so lets create it
//     var closeButtonClick = Observable.fromEvent(document.getElementById('closeButton'), 'click');
//     return keypresses
//       .throttleTime(20)
//       .map((key) => {
//         return key.target.value;
//       })
//       .distinctUntilChanged()
//       .filter((search) => {
//         return search.trim().length > 0
//       })
//       .map((search) => {
//         return searchWikipediaOb(search).retry(3)
//       })
//       .switch()
//       .takeUntil(closeButtonClick)
//   // now we have another dimension so we flattern ....
//   // switch would be cool if we want to stop based on inner that creates another which is the same
//   // but in this case we only want to stop on the close button. so switch would not make sense here
//   // but we want to only listen to keypresses UNTIL the button is clicked
//   // so we need to TAKE UNTIL, so we need the close buttn OBS, we can do this right here
//   }).switch()
  
// searchResultsCleanAndNotEmptyAfterClick.forEach((resultSet) => {
//   searchResultsInput.value = JSON.stringify(resultSet)
// })

// ============== STEP ============== 

// this is all groovy but we have the race condition of an effect happening in the foreach
// that could cause issues, namely the search form style block business may create the dom 
// for the search button, this would mean when we create the close observable it close
// button, although it exists for us. might not exist on something that creates dom on the fly
// lets solve this with do Action

// do action will first do an action, which will return an observable which will then for each
// it is easier to see it in effect
// the naming convension here seems to be en'd and ing
// so form opened and form showing and so on
var searchFormOpened = searchButtonClicks.do((e) => {
  searchForm.style.display = 'block';
})


var searchResultsCleanAndNotEmptyAfterClick = 
  // so after the form is visible ...
  searchFormOpened.map(() => {
    var closeButtonClick = Observable.fromEvent(document.getElementById('closeButton'), 'click');
    // we will also apply the same logic with the colsed of the x button click
    var searchFormClosed = closeButtonClick.do(() => {
      searchForm.style.display = 'none';
    })
    return keypresses
      .throttleTime(20)
      .map((key) => {
        return key.target.value;
      })
      .distinctUntilChanged()
      .filter((search) => {
        return search.trim().length > 0
      })
      .map((search) => {
        return searchWikipediaOb(search).retry(3)
      })
      .switch()
      // notice the change in the until ... now we can insure the order of things
      .takeUntil(searchFormClosed)
  }).switch()
  
searchResultsCleanAndNotEmptyAfterClick.forEach((resultSet) => {
  searchResultsInput.value = JSON.stringify(resultSet)
})