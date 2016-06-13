// Parse the query string
 var params = {},
     queryString = location.hash.substring(1),
     regex = /([^&=]+)=([^&]*)/g,
     m;

 while (m = regex.exec(queryString)) {
     params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
 }

 var watchHistoryId;
 var videoIds = [];

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
                     $('#total-vids-in-history').html('<h1>' + videoIds.length + '</h1><p>videos analyzed</p>');
                     setTimeout(function() { $('#splashscreen').fadeOut(500) }, 1000);
                     setTimeout(function() { $('#actual-page').fadeIn(500) }, 2000);
                 }
             });
     });

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
                 $('#results').html(videoIds.length + ' number of videos in your watch history');
                 setTimeout(function() { $('#splashscreen').fadeOut(500) }, 1000);
                 setTimeout(function() { $('#actual-page').fadeIn(500) }, 2000);
             }
         });
 }
