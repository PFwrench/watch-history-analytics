// Parse the query string
var params = {},
    queryString = location.hash.substring(1),
    regex = /([^&=]+)=([^&]*)/g,
    m;

while (m = regex.exec(queryString)) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
}

var doneCallingSnippetAPI = false;
var doneCallingStatisticsAPI = false;


var watchHistoryId;
var videoIds = [];
var videoSnippets = [];
var videoStatistics = [];
var maxSameCategory;
var categoryArray = [];

$('#get-info').on('click', function() {
    console.log('registered');
    //window.location.href = 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + params['access_token'];
    $.ajax({
            url: 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + params['access_token']
        })
        .done(function(data) {
            console.log(data);
        })
});

//Gets the ID of the authenticated user's watch history playlist
$.ajax({
        url: 'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
        headers: {
            Authorization: 'Bearer ' + params['access_token']
        }
    })
    .done(function(data) {
        watchHistoryId = data.items[0].contentDetails.relatedPlaylists.watchHistory;

        //Initially reads in the first page of watch history, then if there's any additional pages, passes off to a recursive method to retrieve the rest of the video IDs.
        $.ajax({
                url: 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=' + watchHistoryId + '&maxResults=50&mine=true',
                headers: {
                    Authorization: 'Bearer ' + params['access_token']
                }
            })
            .done(function(data) {
                if (data.nextPageToken != undefined) {
                    for (var i = 0; i < data.items.length; i++) {
                        videoIds.push(data.items[i].snippet.resourceId.videoId);
                    }
                    console.log('Lets do it again');
                    getVideoIdsFromHistory(watchHistoryId, data.nextPageToken)
                } else {
                    for (var i = 0; i < data.items.length; i++) {
                        videoIds.push(data.items[i].snippet.resourceId.videoId);
                    }
                    console.log('Less than 50 videos in watch history');
                    console.log(videoIds.length + ' number of videos in your watch history');
                    getVideosSnippets(videoIds);
                    getVideoStatistics(videoIds);
                }
            });
    });

//Clears the splashscreen and loads the dash
function revealDash() {
    setTimeout(function() {
        $('#splashscreen').fadeOut(750);
    }, 1000);
    setTimeout(function() {
        $('#actual-page').fadeIn(750);
        loadVisuals(categoryArray);
        $('.counter').counterUp({
            time: 1000
        });
    }, 2000);
}

//Gets the IDs of the videos in the authenticated user's watch history playlist recursively
function getVideoIdsFromHistory(playlistId, pageToken) {
    $.ajax({
            url: 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=' + watchHistoryId + '&pageToken=' + pageToken + '&maxResults=50&mine=true',
            headers: {
                Authorization: 'Bearer ' + params['access_token']
            }
        })
        .done(function(data) {
            if (data.nextPageToken != undefined) {
                for (var i = 0; i < data.items.length; i++) {
                    videoIds.push(data.items[i].snippet.resourceId.videoId);
                }
                getVideoIdsFromHistory(watchHistoryId, data.nextPageToken)
            } else {
                for (var i = 0; i < data.items.length; i++) {
                    videoIds.push(data.items[i].snippet.resourceId.videoId);
                }
                console.log(videoIds.length + ' number of videos in your watch history.');
                getVideosSnippets(videoIds);
                getVideoStatistics(videoIds);
            }
        });
}


var count1 = 0;

function getVideosSnippets(listOfIds) {
    $.ajax({
            url: 'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + listOfIds[count1],
            headers: {
                Authorization: 'Bearer ' + params['access_token']
            }
        })
        .done(function(data) {
            if (count1 < listOfIds.length) {
                videoSnippets.push(data.items[0]);
                count1++;
                getVideosSnippets(videoIds);
            } else {
                doneCallingSnippetAPI = true;
                console.log("DONE WITH SNIPPET, GETTING CATEGORIES");
                getCategoryInfo();
                if (doneCallingStatisticsAPI) {
                    revealDash();
                }
            }
        });
}


function getCategoryInfo() {

    //Counts number of videos in each category
    for (var i = 0; i < videoSnippets.length; i++) {

        if (videoSnippets[i] != undefined) {
            var currentId = parseInt(videoSnippets[i].snippet.categoryId);

            var alreadyExists = false;

            for (var j = 0; j < categoryArray.length; j++) {
                if(currentId == categoryArray[j].id) {
                    categoryArray[j].count++;
                    alreadyExists = true;
                    break;
                }
            };

            if (!alreadyExists) {
                var temp = {
                                "id": currentId,
                                "name": "",
                                "count": 1
                        };

                categoryArray.push(temp);
            }
        }
    }
        

    //Retrieves the names of the category IDs from the Google API
    var categoryIds = videoSnippets[0].snippet.categoryId;

    for (var i = 0; i < videoSnippets.length; i++) {
        if (videoSnippets[i] != undefined) {
            categoryIds = categoryIds + ',' + videoSnippets[i].snippet.categoryId;
        }
    }

    $.ajax({
            url: 'https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&id=' + categoryIds + '&mine=true',
            headers: {
                Authorization: 'Bearer ' + params['access_token']
            }
        })
        .done(function(data) {
            //categoryArray = data.items;
            console.log(data);
            var googleCategoryInfo = data.items;

            for (var i = 0; i < googleCategoryInfo.length; i++) {
                for (var j = 0; j < categoryArray.length; j++) {
                    if (googleCategoryInfo[i].id == categoryArray[j].id) {
                        categoryArray[j].name = googleCategoryInfo[i].snippet.title;
                    }
                };
            };
        });
}


var count2 = 0;

function getVideoStatistics(listOfIds) {
    $.ajax({
            url: 'https://www.googleapis.com/youtube/v3/videos?part=statistics&id=' + listOfIds[count2],
            headers: {
                Authorization: 'Bearer ' + params['access_token']
            }
        })
        .done(function(data) {
            if (count2 < listOfIds.length) {
                videoStatistics.push(data.items[0]);
                count2++;
                getVideoStatistics(videoIds);
            } else {
                doneCallingStatisticsAPI = true;

                var maxLikes = 0;
                var maxLikesLocation;

                for (var i = 0; i < videoStatistics.length; i++) {
                    var current = 0;
                    if (videoStatistics[i] != undefined) { //fix this eventually
                        current = parseInt(videoStatistics[i].statistics.likeCount);
                    }
                    if (current > maxLikes) {
                        maxLikes = current;
                        maxLikesLocation = i;
                    }
                };

                var maxViews = 0;
                var maxViewsLocation;

                for (var i = 0; i < videoStatistics.length; i++) {
                    var current = 0;
                    if (videoStatistics[i] != undefined) { //fix this eventually
                        current = parseInt(videoStatistics[i].statistics.viewCount);
                    }
                    if (current > maxViews) {
                        maxViews = current;
                        maxViewsLocation = i;
                    }
                }

                $('#most-likes').html('<h1 class="counter">' + maxLikes + '</h1><p>likes on </p>' + videoSnippets[maxLikesLocation].snippet.title);
                $('#most-views').html('<h1 class="counter">' + maxViews + '</h1><p>views on </p>' + videoSnippets[maxViewsLocation].snippet.title);
                $('#total-vids-in-history').html('<h1 class="counter">' + listOfIds.length + '</h1><p>videos analyzed</p>');
                if (doneCallingSnippetAPI) {
                    revealDash();
                }
            }
        })
}
