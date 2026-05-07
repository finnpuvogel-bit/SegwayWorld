// Zahlen-Animation
let valueDisplays = document.querySelectorAll(".num");
valueDisplays.forEach((valueDisplay) => {
    let startValue = 0;
    let endValue = parseInt(valueDisplay.getAttribute("data-val"));
    let counter = setInterval(function () {
        startValue += Math.ceil(endValue / 50);
        if (startValue >= endValue) {
            startValue = endValue;
            clearInterval(counter);
        }
        valueDisplay.textContent = startValue;
    }, 30);
});

// Discord Link kopieren
function copyIP() {
    const link = "https://discord.gg/DEIN-LINK"; // HIER DEINEN LINK EINTRAGEN
    navigator.clipboard.writeText(link);
    alert("Discord Link kopiert! Füge ihn in deinen Browser ein.");
}

// Kauf-Anfrage
function openPurchase() {
    alert("Bitte melde dich im Discord im Kanal #tickets für die 50km/h Datei oder den Ghost Mode!");
}