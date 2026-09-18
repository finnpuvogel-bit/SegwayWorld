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

// Bluetooth Live Tuning
const FW_CHARACTERISTIC_UUID = "0000e001-0000-1000-8000-00805f9b34fb";
let bluetoothDevice = null;
let fwCharacteristic = null;

const connectButton = document.getElementById("bluetooth-connect");
const tuningToggle = document.getElementById("field-weakening-toggle");
const tuningStatus = document.getElementById("tuning-status");
const bluetoothMessage = document.getElementById("bluetooth-message");

function setBluetoothMessage(message, isError = false) {
    bluetoothMessage.textContent = message;
    bluetoothMessage.classList.toggle("error", isError);
}

async function findFwCharacteristic(server) {
    const services = await server.getPrimaryServices();
    for (const service of services) {
        try {
            const characteristic = await service.getCharacteristic(FW_CHARACTERISTIC_UUID);
            if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                return characteristic;
            }
        } catch {
            // The characteristic is not part of this service.
        }
    }
    throw new Error("Die FW-Characteristic 0000e001 wurde nicht gefunden.");
}

async function connectBluetooth() {
    if (!navigator.bluetooth) {
        setBluetoothMessage("WebBluetooth wird von diesem Browser nicht unterstützt.", true);
        return;
    }

    try {
        setBluetoothMessage("Suche nach einem kompatiblen Segway …");
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ["0000e000-0000-1000-8000-00805f9b34fb", "0000ffe0-0000-1000-8000-00805f9b34fb"]
        });
        bluetoothDevice.addEventListener("gattserverdisconnected", () => {
            fwCharacteristic = null;
            tuningToggle.checked = false;
            tuningToggle.disabled = true;
            tuningStatus.textContent = "Standard Modus";
            connectButton.textContent = "Bluetooth verbinden";
            setBluetoothMessage("Verbindung getrennt.");
        });
        const server = await bluetoothDevice.gatt.connect();
        fwCharacteristic = await findFwCharacteristic(server);
        tuningToggle.disabled = false;
        connectButton.textContent = "Verbunden";
        setBluetoothMessage(`${bluetoothDevice.name || "Segway"} ist verbunden.`);
    } catch (error) {
        setBluetoothMessage(error.message || "Bluetooth-Verbindung konnte nicht hergestellt werden.", true);
    }
}

async function sendFieldWeakening(enabled) {
    if (!fwCharacteristic) return;

    try {
        const packet = new Uint8Array([enabled ? 0x01 : 0x00]);
        if (fwCharacteristic.properties.writeWithoutResponse) {
            await fwCharacteristic.writeValueWithoutResponse(packet);
        } else {
            await fwCharacteristic.writeValue(packet);
        }
        tuningStatus.textContent = enabled ? "Tuning Aktiv" : "Standard Modus";
        setBluetoothMessage(enabled ? "FW = 1 wurde gesendet." : "FW = 0 wurde gesendet.");
    } catch (error) {
        tuningToggle.checked = !enabled;
        setBluetoothMessage(error.message || "FW-Befehl konnte nicht gesendet werden.", true);
    }
}

connectButton.addEventListener("click", connectBluetooth);
tuningToggle.addEventListener("change", () => sendFieldWeakening(tuningToggle.checked));

// Kauf-Anfrage
function openPurchase() {

    alert("Bitte melde dich im Discord im Kanal #tickets für die 50km/h Datei oder den Ghost Mode!");
}
