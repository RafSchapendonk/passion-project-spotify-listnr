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

    $("#content-button").click(function () {
        loadPage("./views/test.html");
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
var redirect_uri = "http://127.0.0.1:5502/src/index.html";
// TO-DO Hide client dat in env file
var client_id = "f0f0c66ea501495e8e9755f63932633c";
var client_secret = "afe7526d836b40079015b2c7c9673fe7";

var currentPlaylist = "";

// Spotify api calls
const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PAUSE = "https://api.spotify.com/v1/me/player/pause";
const NEXT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS = "https://api.spotify.com/v1/me/player/previous";
const PLAYER = "https://api.spotify.com/v1/me/player";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const TRACK = "https://api.spotify.com/v1/tracks/"
const CURRENTLYPLAYING =
    "https://api.spotify.com/v1/me/player/currently-playing";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";
const RECOMMEND = "https://api.spotify.com/v1/recommendations?limit=10";

function onPageLoad() {
    if (window.location.search.length > 0) {
        handleRedirect();
    } else {
        access_token = localStorage.getItem("access_token");
        if (access_token == null) {
            //Acess token unavailable so present token section
            requestAuthorization();
            console.log("Access token unavailable");
        } else {
            //Access token available present device section
            console.log("Acess token available");
            refreshPlaylists();
        }
    }
}

// Authorization
function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
    //Remove parameters from URL
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
    //Check for a succesfull response
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        //Make sure correct tokens were recieved
        if (data.access_token != undefined) {
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if (data.refresh_token != undefined) {
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
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

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url +=
        "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
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

function handlePlaylistsResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems("playlists");
        data.items.forEach((item) => addPlaylist(item));
        document.getElementById("playlists").value = currentPlaylist;
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addPlaylist(item) {
    let node = document.createElement("option");
    node.value = item.id;
    node.onclick = function () { fetchTracks(); };
    node.innerHTML = item.name + " (" + item.tracks.total + ")";
    document.getElementById("playlists").appendChild(node);
}

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
        url = TRACKS.replace("{{PlaylistId}}", playlist_id);
        callApi("GET", url, null, handleTracksResponse);
    }
}

function handleTracksResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
        data.items.forEach((item) => callApi("GET", TRACK + item.track.id, null, handleTrackDataResponse));
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function handleTrackDataResponse() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        console.log(data);
    } else if (this.status == 401) {
        refreshAccessToken();
    } else {
        console.log(this.responseText);
        // alert(this.responseText);
    }
}