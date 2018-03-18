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
function searchWikipedia(term) {
  var url = `http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(term)}&callback=?`;
  $.getJSON(url, function(data) {
    console.log(data);
  });
}

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
var searchResults = keypresses
  // {..... a..b ...... c......e}
  .throttleTime(20)
  // {.........b...............e} 
  .map((key) => {
    console.log(key.target.value)
    // this is the "Observable" of one
    return searchWikipediaOb(key.target.value)
  })
  /*
  At this stage we have a 2D map, so we will need to concatALL
  {
    ....... {...... ["better", "blocking"]}
    ...........{................["benifit", "because"]}

  }
  now, this is diff between arrays, not only "how many flatterns do I need"
  but "which shold I use!!"
  as we have a collection of collections over time we can use one of the follwoing

  - mergeAll
  - concatAll
  - switchLatest (This is the most common one to use for UI)

  on merge all we would get, in the order they come in, like lanes on a motorway
  {.....["better", "blocking"].........["benifit", "because"]}
  
  on concatALL we would get the same 'order' but would not
  call forEach on the next one until the prev was finished
  so the time will be included but over a much longer time
  {.....["better", "blocking"]................["benifit", "because"]}

  on switch we get ONLY the last one
  {..........................................["benifit", "because"]}
  as we where waiting for the on next or on complete we got another 
  network req and then called dispose, and started listening to the new one
  THIS is how we can cancel network requests something that promises cannot do
  AND there is no RACE CONDITION! some network requests might come back 
  before others!
  */
  .switch()



// THEN call for each on WHAT WE WANT TO DO WITH IT!
searchResults.forEach((resultSet) => {
  console.log(JSON.stringify(resultSet))
  searchResultsInput.value = JSON.stringify(resultSet)
})