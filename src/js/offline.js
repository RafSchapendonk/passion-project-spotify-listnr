let feitjes = ["Het budget van de film Titanic (200 miljoen) was achterlijk veel hoger dan de kosten van schip zelf destijds (7,5 miljoen).",
    "Alle boeken in het kantoor van Perkamentus uit Harry Potter zijn gewoon telefoonboeken waar leer omheen gebonden is.",
    "Alle goudkleurige verf in heel Nieuw-Zeeland was gebruikt voor het maken van de sets van The Hobbit films.",
    "De modder in de tunnel waar Tim Robbins de gevangenis door ontsnapt in de film Shawshank Redemption is niet echt. Het was eigenlijk een mix van zaagsel, chocoladesiroop en water.",
    "De geluiden die de dinosaurussen maken in de film Jurassic Park zijn niet digitaal gemaakt, maar zijn eigenlijk opnames van schildpadden die seks hebben.",
    "Het tapijt-ontwerp in Toy Story 3 is exact hetzelfde als in de klassieke horrorfilm The Shining.",
    "Eén van de vroegere James Bond acteurs (Sean Connery) droeg in alle films een pruik.",
    "Psycho is de eerste Amerikaanse film ooit waar daadwerkelijk een wc in voorkwam."
]

let index = 0;
const feitElement = document.querySelector('#feitje')

feitElement.innerHTML = feitjes[Math.floor(Math.random() * 8)]

function change() {
    feitElement.innerHTML = feitjes[index];
    index > 1 ? index = 0 : index++;
}

window.onload = function () {
    setInterval(change, 5000);
};