function loadPage(route) {
    $("#root").load(route, function (statusTxt, jqXHR) {
        if (statusTxt == "success") {
            alert("New content loaded successfully!");
        }
        if (statusTxt == "error") {
            alert("Error: " + jqXHR.status + " " + jqXHR.statusText);
        }
    });
}

$(document).ready(function () {
    $("#root").load("./views/home.html", function (statusTxt, jqXHR) {
        if (statusTxt == "success") {
            alert("New content loaded successfully!");
        }
        if (statusTxt == "error") {
            alert("Error: " + jqXHR.status + " " + jqXHR.statusText);
        }
    });

    $("#about-button").click(function () {
        loadPage("./views/about.html");
    });

    $("#home-button").click(function () {
        loadPage("./views/home.html");
    });

    $("#contact-button").click(function () {
        loadPage("./views/contact.html");
    });
});

//Service worker
//See if the browser supports Service Workers, if so try to register one
if ("serviceWorker" in navigator) {
    navigator.serviceWorker
        .register("service-worker.js")
        .then(function (registering) {
            // Registration was successful
            console.log(
                "Browser: Service Worker registration is successful with the scope",
                registering.scope
            );
        })
        .catch(function (error) {
            //The registration of the service worker failed
            console.log(
                "Browser: Service Worker registration failed with the error",
                error
            );
        });
} else {
    //The registration of the service worker failed
    console.log("Browser: I don't support Service Workers :(");
}

var installButton = document.getElementById("installID");
var installPrompt; //Variable to store the install action in
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); //Prevent the event (this prevents the default bar to show up)
    installPrompt = event; //Install event is stored for triggering it later
    //...do something here to show your install button
    installButton.style.visibility = "visible";
    console.log(installPrompt);
});

//Spotify authentication
var redirect_uri = "https://i447972.hera.fhict.nl";
// var redirect_uri = "http://127.0.0.1:5501/src/index.html";
// TO-DO Hide client dat in env file
var client_id = "f0f0c66ea501495e8e9755f63932633c";
var client_secret = "afe7526d836b40079015b2c7c9673fe7";

var userSpotifyId = ""

var currentPlaylist = "";
var currentSongUri = "";
var playlistBeingAdded = "";
// Array where all the fetched genres get put into
var playlistGenres = [];
// Array where playlistgenres get counted
var frequenceItems = [];
// Necessary data to determine playlist recommendations
// No popularity because the goal of the app is to discover something new
var playlistLength = 0;
var danceability = 0;
var acousticness = 0;
var energy = 0;
var instrumentalness = 0;
var key = 0;
var liveness = 0;
var loudness = 0;
var mode = 0;
var speechiness = 0;
var tempo = 0;
var valence = 0;

// Counter for the amount of calls are made to make sure all calls have been made before certain code gets executed.
var trackFeatureCalls = 0;
var recommendationIndex = 0;
var currentRecommendations = []

// Spotify api calls
const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
const USER = "https://api.spotify.com/v1/me";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const CREATEPLAYLIST = "https://api.spotify.com/v1/users/{{user_id}}/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PAUSE = "https://api.spotify.com/v1/me/player/pause";
const NEXT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS = "https://api.spotify.com/v1/me/player/previous";
const PLAYER = "https://api.spotify.com/v1/me/player";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const TRACKDETAIL = "https://api.spotify.com/v1/tracks/";
const TRACKFEATURES = "https://api.spotify.com/v1/audio-features/";
const ARTIST = "https://api.spotify.com/v1/artists/";
const CURRENTLYPLAYING =
    "https://api.spotify.com/v1/me/player/currently-playing";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";
const RECOMMEND = "https://api.spotify.com/v1/recommendations?";

function onPageLoad() {
    if (window.location.search.length > 0) {
        handleRedirect();
    } else {
        access_token = localStorage.getItem("access_token");
        if (access_token == null) {
            //Acess token unavailable so send a new authorization request
            requestAuthorization();
            console.log("Access token unavailable");
        } else {
            //Access token available execute needed code
            console.log("Acess token available");
            getUserId()
            refreshPlaylists();
        }
    }
}

// Authorization
function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    // Remove parameters from URL
    window.history.pushState("", "", redirect_uri);
}

function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken() {
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader(
        "Authorization",
        "Basic " + btoa(client_id + ":" + client_secret)
    );
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse() {
    // Check for a succesfull response
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        // Make sure correct tokens were received
        if (data.access_token != undefined) {
            access_token = data.access_token;
            // Locally store the needed tokens
            localStorage.setItem("access_token", access_token);
        }
        if (data.refresh_token != undefined) {
            refresh_token = data.refresh_token;
            // Locally store the needed tokens
            localStorage.setItem("refresh_token", refresh_token);
        }
        // Rerun onPageLoad so the code will be executed with the correct tokens.
        onPageLoad();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function getCode() {
    let code = null;
    const queryString = window.location.search;
    // Make sure query contains data
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        // Set and return queried value of code
        code = urlParams.get("code");
    }
    return code;
}

function requestAuthorization() {
    console.log("requesting authorization");

    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    // Construct authorization URL
    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url +=
        "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private playlist-modify-public playlist-modify-private";
    // Show Spotify authorization window
    window.location.href = url;
}

// General api request
function callApi(method, url, body, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

// Fetching user's playlists
function refreshPlaylists() {
    callApi("GET", PLAYLISTS, null, handlePlaylistsResponse);
}

function getUserId() {
    callApi("GET", USER, null, handleGetUserId);
}

function handleGetUserId() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        userSpotifyId = data.id
        console.log(data)
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handlePlaylistsResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        // Clear all items in the select menu when to avoid adding items that dont exist anymore or items that are already inside the menu
        removeAllItems("playlists");
        // Add all fetched items to the select menu
        data.items.forEach((item) => addPlaylist(item));
        document.getElementById("playlists").value = currentPlaylist;
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

// Add a playlist to the dropdown menu
function addPlaylist(item) {
    let node = document.createElement("option");
    node.value = item.id;
    node.onclick = function () { fetchTracks(); };
    node.className = "w-3/4"
    node.innerHTML = item.name;
    document.getElementById("playlists").appendChild(node);
}

// General function for removing children
function removeAllItems(elementId) {
    let node = document.getElementById(elementId);
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

// Fetching playlist tracks
function fetchTracks() {
    console.log("fetching tracks")
    let playlist_id = document.getElementById("playlists").value;
    if (playlist_id.length > 0) {
        // Insert playlist ID inside of the fetch request
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        callApi("GET", url, null, handleTracksResponse);
    }
}

function handleTracksResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);

        // Reset all data from previous call
        playlistLength = 0
        acousticness = 0
        danceability = 0
        energy = 0
        instrumentalness = 0
        key = 0
        liveness = 0
        loudness = 0
        mode = 0
        speechiness = 0
        tempo = 0
        valence = 0
        trackFeatureCalls = 0
        playlistGenres = []
        playlistLength = data.total

        // There is no suitable way to get a genre from a specific track
        // Currently the most accurate way to get genres is by fetching the genres from the artist so this is how I will be determining the suitable genres
        data.items.forEach((item) => {
            // Get the features from a track such as danceability
            callApi("GET", ARTIST + item.track.artists[0].id, null, handleArtistResponse)
            callApi("GET", TRACKFEATURES + item.track.id, null, handleTrackFeaturesResponse)
        });

    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleTrackDetailResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
    }
}

function handleTrackFeaturesResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        // Add up all song features so an average can be calculated later on
        acousticness += data.acousticness
        danceability += data.danceability
        energy += data.energy
        instrumentalness += data.instrumentalness
        key += data.key
        liveness += data.liveness
        loudness += data.loudness
        mode += data.mode
        speechiness += data.speechiness
        tempo += data.tempo
        valence += data.valence

        trackFeatureCalls++

        if (trackFeatureCalls === playlistLength) {
            mostFrequentArrayItems(playlistGenres)
            fetchRecommendations()
        }
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        // alert(this.responseText);
    }
}

function fetchRecommendations() {
    // Reset recommendationIndex
    recommendationIndex = 0;

    // Calculate feature averages
    let avgAcousticness = acousticness / playlistLength
    let avgDanceability = danceability / playlistLength
    let avgEnergy = energy / playlistLength
    let avgInstrumentalness = instrumentalness / playlistLength
    let avgKey = key / playlistLength
    let avgLiveness = liveness / playlistLength
    let avgLoudness = loudness / playlistLength
    let avgMode = mode / playlistLength
    let avgSpeechiness = speechiness / playlistLength
    let avgTempo = tempo / playlistLength
    let avgValence = valence / playlistLength

    // Create variables with the playlists top 5 most frequent genre's 
    let topGenre1 = frequenceItems[0]
    let topGenre2 = frequenceItems[1]
    let topGenre3 = frequenceItems[2]
    let topGenre4 = frequenceItems[3]
    let topGenre5 = frequenceItems[4]
    let topGenres = ""

    // Check if all genres have a value
    if (topGenre2 != undefined && topGenre3 != undefined && topGenre4 != undefined && topGenre5 != undefined) {
        topGenres = topGenre1[0] + "," + topGenre2[0] + "," + topGenre3[0] + "," + topGenre4[0] + "," + topGenre5[0]
    }
    else if (topGenre3 != undefined && topGenre4 != undefined && topGenre5 != undefined) {
        topGenres = topGenre1[0] + "," + topGenre2[0] + "," + topGenre3[0] + "," + topGenre4[0]
    }
    else if (topGenre4 != undefined && topGenre5 != undefined) {
        topGenres = topGenre1[0] + "," + topGenre2[0] + "," + topGenre3[0]
    }
    else if (topGenre5 != undefined) {
        topGenres = topGenre1[0] + "," + topGenre2[0]
    }
    else {
        topGenres = topGenre1[0]
    }

    console.log(topGenres)

    // Add all parameters together for the API call
    var queryString =
        "&seed_genres=" + topGenres
        + "&target_acousticness=" + avgAcousticness
        + "&target_danceability" + avgDanceability
        + "&target_energy=" + avgEnergy
        + "&target_instrumentalness=" + avgInstrumentalness
        + "&target_liveness=" + avgLiveness
        + "&target_loudness=" + avgLoudness
        + "&target_speechiness=" + avgSpeechiness
        + "&target_tempo=" + avgTempo
        + "&target_valence=" + avgValence
        // The spotify api only accepts the following parameters as integers
        + "&target_key=" + Math.round(avgKey)
        + "&target_mode=" + Math.round(avgMode);
    console.log(RECOMMEND + queryString)
    callApi("GET", RECOMMEND + queryString, null, handleRecommendationResponse)
}

function handleRecommendationResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        if (data.tracks.length < 10) {
            alert("Sorry we couldnt find any recommendations for you. Looks like you already have the perfect playlist.")
        }
        else {
            currentRecommendations = data
            play(data)
        }
    }
    else if (this.status == 401) {
        refreshAccessToken();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleArtistResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        playlistGenres = playlistGenres.concat(data.genres);
    }
    else if (this.status == 401) {
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function mostFrequentArrayItems(arr) {
    // New array with item count
    frequenceItems = [];

    // Cycless through data
    for (let item of arr) {
        // Checks if the item already exist in the array and up the count if so. Otherwise add it to the array
        let addOrNot = searchForItem(item, frequenceItems);
        // If the item does not yet exist true is returned and the following code will run to add the new object with a count of 1.
        if (addOrNot) {
            let itemToPush = [item, 1];
            frequenceItems.push(itemToPush);
        }
    }

    // Sort based on second array item
    frequenceItems.sort(function (a, b) {
        return a[1] - b[1];
    });
    frequenceItems.reverse();
}

function searchForItem(item, frequenceItems) {
    let addOrNot = true;
    // Look through items from the new array to check if the item already exists. If it doesnt exist return true
    for (let fitem of frequenceItems) {
        if (item == fitem[0]) {
            fitem[1]++;
            addOrNot = false;
            return addOrNot;
        }
        else {
            addOrNot = true;
        }
    }
    return addOrNot;
}


// Function which plays the currently selected song
function play(data) {
    console.log(data)
    let body = {};
    body.context_uri = data.tracks[recommendationIndex].album.uri;
    body.offset = {};
    body.offset.position = 0
    body.offset.position_ms = 0;
    console.log("Call play")
    callApi("PUT", PLAY, JSON.stringify(body), handleApiResponse);
}

// Function that checks what song is currently playing according to Spotify
function currentlyPlaying() {
    console.log("Calling currently playing")
    callApi("GET", PLAYER, null, handleCurrentlyPlayingResponse);
}

function handleApiResponse() {
    console.log("Handling API resonse")
    if (this.status == 200) {
        console.log(this.responseText);
        setTimeout(currentlyPlaying, 500);
    }
    else if (this.status == 204) {
        setTimeout(currentlyPlaying, 500);
    }
    else {
        console.log(this.responseText)
        alert(this.responseText)
    }
}

function handleCurrentlyPlayingResponse() {
    console.log("Handling currently playing")
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        if (data.item != null) {
            // Update data for the current song
            document.getElementById("albumImage").src = data.item.album.images[0].url;
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("trackArtist").innerHTML = data.item.artists[0].name;
            currentSongUri = data.item.uri
        }
    }
    else if (this.status == 401) {
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function like() {
    addToRecommendations()
    recommendationIndex++;
    play(currentRecommendations);
}

function dislike() {
    recommendationIndex++;
    play(currentRecommendations);
}

// Function that adds the liked song to a firesstore document so it can be added in a playlist later.
function addToRecommendations() {
    // Creating a name for the playlist.
    let e = document.getElementById("playlists");
    let playlistName = e.options[e.selectedIndex].text;
    let dateObj = new Date();
    let date = dateObj.getUTCDate() + "-" + dateObj.getUTCMonth() + 1;
    let recommendationName = "Listnr " + date + " " + playlistName;
    let docName = recommendationName + "-" + userSpotifyId;

    // Check if the playlist already exists. If that is the case the song will be added to the array.
    // If it isn't a new playlist item will be created.
    docRef = db.collection("users").doc(docName)
        .get()
        .then((doc) => {
            if (doc.exists) {
                console.log("Document data:", doc.data());
                db.collection("users").doc(docName).update({
                    songs: firebase.firestore.FieldValue.arrayUnion(currentSongUri)
                })
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
                db.collection("users").doc(docName).set({
                    doc_name: docName,
                    name: recommendationName,
                    user_id: userSpotifyId,
                    songs: [currentSongUri]
                })
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
}

// When the library page gets opened the following code needs to run for the correct playlists to be displayed.
async function onLibraryLoad() {
    db.collection("users").where("user_id", "==", userSpotifyId)
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                addToRecommendationsLibrary(doc);
            });
        })
        .catch((error) => {
            console.log("Error getting documents: ", error);
        });
}

// The playlists get injected into the HTML
function addToRecommendationsLibrary(doc) {
    let node = document.createElement("div");
    node.value = doc.data().doc_name;
    node.onclick = function () { addToSpotify(this.value); };
    node.className = "mb-4"
    node.innerHTML = doc.data().name;
    document.getElementById("recommendation_playlists").appendChild(node);
}

// The following code adds a new playlist to spotify based on the data that was saved in the firestore.
function addToSpotify(value) {
    console.log(value)
    playlistBeingAdded = value
    db.collection("users")
        .doc(value)
        .get()
        .then((doc) => {
            let body = {};
            body.name = doc.data().name
            body.description = "Recommendations discovered with Listnr"
            body.public = false
            console.log(body)
            url = CREATEPLAYLIST.replace("{{user_id}}", userSpotifyId);
            callApi("POST", url, JSON.stringify(body), handlePlaylistCreation);
        })
}

// After the playlist is created all songs will be added in the following function
function handlePlaylistCreation() {
    console.log("Handling playlist creation response")
    if (this.status == 201) {
        let allSongData = ""
        let songsLength = 1
        let songsCurrentLength = 0
        let newPlaylistData = JSON.parse(this.responseText)

        db.collection("users")
            .doc(playlistBeingAdded)
            .get()
            .then((doc) => {
                songsLength = doc.data().songs.length
                doc.data().songs.forEach(song => {
                    // Check if the current item is the second last item so the api call will have the correct format.
                    if (songsCurrentLength === songsLength - 1) {
                        allSongData += song
                        songsCurrentLength++
                        console.log(allSongData)

                        url = TRACKS.replace("{{PlaylistId}}", newPlaylistData.id);
                        callApi("POST", url + "?uris=" + allSongData, null, handleTrackPostResponse);
                    }
                    else {
                        allSongData += song + ","
                        console.log(allSongData)
                        songsCurrentLength++
                    }

                })
            })
    }
    else if (this.status == 204) {
        setTimeout(currentlyPlaying, 500);
    }
    else {
        console.log(this.responseText)
        alert(this.responseText)
    }
}

function handleTrackPostResponse() {
    if (this.status == 201) {
        console.log(this.responseText);
        alert("Your new playlist has succesfully been saved.")
    }
    else if (this.status == 204) {
        setTimeout(currentlyPlaying, 500);
    }
    else {
        console.log(this.responseText)
        alert(this.responseText)
    }
}