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
        loadPage('./views/about.html')
    });

    $("#home-button").click(function () {
        loadPage('./views/home.html')
    });

    $("#contact-button").click(function () {
        loadPage('./views/contact.html')
    });

    $("#content-button").click(function () {
        loadPage('./views/test.html')
    });
});

//Service worker
//See if the browser supports Service Workers, if so try to register one
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").then(function (registering) {
        // Registration was successful
        console.log("Browser: Service Worker registration is successful with the scope", registering.scope);
    }).catch(function (error) {
        //The registration of the service worker failed
        console.log("Browser: Service Worker registration failed with the error", error);
    });
} else {
    //The registration of the service worker failed
    console.log("Browser: I don't support Service Workers :(");
}

var installButton = document.getElementById("installID")
var installPrompt; //Variable to store the install action in
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); //Prevent the event (this prevents the default bar to show up)
    installPrompt = event; //Install event is stored for triggering it later
    //...do something here to show your install button
    installButton.style.visibility = "visible"
    console.log(installPrompt)
});

//Spotify authentication
var redirect_uri = "http://127.0.0.1:5500/src/index.html"
var client_id = "";
var client_secret = "";

const AUTHORIZE = "https://accounts.spotify.com/authorize"

function onPagLoad() {
    if (window.location.search.length > 0) {
        handleRedirect();
    }
}

function handleRedirect() {
    let code = getCode();
    fetchAccessToken(code);
}

function fetchAccessToken(code) {
    let body = "grant_type=authorization_code";
    body += "&code=" + code;
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    // !!!!!!!!!!!!!!!!!!!!!
}

function getCode() {
    let code = null;
    const queryString = window.location.search;
    // Make sure query contains data
    if (queryString.length > 0) {
        const urlParams = new URLSearchParams(queryString);
        // Set and return queried value of code
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization() {
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;
    // TO-DO hide client data in env file
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    // Show Spotify authorization window
    window.location.href = url;
}
