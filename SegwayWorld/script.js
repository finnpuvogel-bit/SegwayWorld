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

// Ninebot Bluetooth-Verbindung und Auth-Handshake
async function connectScooter() {
    const status = document.getElementById("connection-status");
    const connectButton = document.querySelector(".connect-btn");

    try {
        connectButton.disabled = true;
        status.textContent = "Suche nach deinem Ninebot...";

        const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "NB-" }, { namePrefix: "Ninebot" }],
            optionalServices: ["0000e0ff-0000-1000-8000-00805f9b34fb"]
        });

        status.textContent = "Verbindung wird aufgebaut...";
        const server = await device.gatt.connect();
        showPowerPopup();

        const service = await server.getPrimaryService("0000e0ff-0000-1000-8000-00805f9b34fb");
        const authCharacteristic = await service.getCharacteristic("0000e001-0000-1000-8000-00805f9b34fb");
        const authFrame = new Uint8Array([0x5B, 0xA5, 0x01, 0xF0, 0x00, 0x00, 0x00, 0xFF, 0x04]);

        await authCharacteristic.writeValue(authFrame);
        status.textContent = "Auth-Handshake gesendet. Drücke jetzt kurz den Power-Knopf.";
    } catch (error) {
        console.error("Verbindungsfehler:", error);
        status.textContent = error.name === "NotFoundError"
            ? "Keine Verbindung ausgewählt."
            : "Verbindung konnte nicht hergestellt werden.";
    } finally {
        connectButton.disabled = false;
    }
}

function showPowerPopup() {
    document.getElementById("power-popup").hidden = false;
    document.querySelector(".modal-close").focus();
}

function closePowerPopup() {
    document.getElementById("power-popup").hidden = true;
}

document.getElementById("power-popup").addEventListener("click", (event) => {
    if (event.target.id === "power-popup") closePowerPopup();
});

// Kauf-Anfrage
function openPurchase() {
    alert("Bitte melde dich im Discord im Kanal #tickets für die 50km/h Datei oder den Ghost Mode!");
}
