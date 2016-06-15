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
                    console.log('Only one page or less of videos');
                    console.log(videoIds.length + ' number of videos in your watch history');
                    getVideosSnippets(videoIds);
                    getVideoStatistics(videoIds);
                }
            });
    });

//Clears the splashscreen and loads the dash
function revealDash() {
    setTimeout(function() {
        $('#splashscreen').fadeOut(500);
    }, 1000);
    setTimeout(function() {
        $('#actual-page').fadeIn(500);
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
                doneCallingStatisticsAPI = true;
                if (doneCallingStatisticsAPI) {
                    revealDash();
                }
            }
        })
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

                var max = 0;
                var maxLocation;

                for (var i = 0; i < videoStatistics.length; i++) {
                    var current = 0;
                    if (videoStatistics[i] != undefined) { //fix this eventually
                        current = parseInt(videoStatistics[i].statistics.likeCount);
                    }
                    if (current > max) {
                        max = current;
                        maxLocation = i;
                    }
                };
                $('#most-likes').html('<h1 class="counter">' + max + '</h1><p>likes on </p>' + videoSnippets[maxLocation].snippet.title);
                $('#total-vids-in-history').html('<h1 class="counter">' + listOfIds.length + '</h1><p>videos analyzed</p>');
                if (doneCallingSnippetAPI) {
                    revealDash();
                }
            }
        })
}
