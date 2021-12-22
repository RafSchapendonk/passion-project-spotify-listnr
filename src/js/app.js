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