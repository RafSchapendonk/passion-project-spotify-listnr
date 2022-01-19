//Sla cache op in variabele
const cacheVersie = 'm-app-cache-v1'
const appCacheFiles = [
  '',
]

self.addEventListener("install", (installing) => {
  console.log("Service Worker: I am being installed, hello world!");
  //Put important offline files in cache on installation of the service worker
  installing.waitUntil(
    caches.open(cacheVersie).then((cache) => {
      console.log("Service Worker: Caching important offline files");
      return cache.addAll(appCacheFiles);
    })
  );

});

self.addEventListener("activate", (activating) => {
  console.log("Service Worker: All systems online, ready to go!");
});

self.addEventListener("fetch", (fetching) => {
  console.log("Service Worker: User threw a ball, I need to fetch it!");

  //Return cache of vervang voor nieuwe versie
  fetching.respondWith(
    caches.match(fetching.request.url).then((response) => {
      console.log("Service Worker: Fetching resource " + fetching.request.url);
      return response || fetch(fetching.request).then((response) => {
        console.log("Service Worker: Resource " + fetching.request.url + " not available in cache");
        return caches.open(cacheVersie).then((cache) => {
          console.log("Service Worker: Caching (new) resource " + fetching.request.url);
          //cache.put(fetching.request,response.clone());
          return response;
        });
      }).catch(function () {
        console.log(fetching.request.mode);
        if (fetching.request.mode == "navigate") {
          return caches.match("offline.html");
        }

      })
    })
  );
});

self.addEventListener("push", (pushing) => {
  console.log("Service Worker: I received some push data, but because I am still very simple I don't know what to do with it :(");

  if (pushing.data) {
    pushdata = JSON.parse(pushing.data.text());
    console.log("Service Worker: I received this:", pushdata);
    if ((pushdata["title"] != "") && (pushdata["message"] != "")) {
      const options = { body: pushdata["message"] }
      self.registration.showNotification(pushdata["title"], options);
      console.log("Service Worker: I made a notification for the user");
    } else {
      console.log("Service Worker: I didn't make a notification for the user, not all the info was there :(");
    }
  }

})




