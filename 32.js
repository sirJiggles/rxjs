require('./rx');

var moviesWithHighRatings =
	movieLists.
		concatMap(function(movieList) {
			return movieList.videos.
				filter(function(video) {
					return video.rating === 5.0;
				});
		});