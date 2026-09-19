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

// Bluetooth Controller
const SERVICE_UUID = "0000e0ff-0000-1000-8000-00805f9b34fb";
const CHARACTERISTIC_UUID = "0000e001-0000-1000-8000-00805f9b34fb";
const VALID_CODES = ["SEGWAY40", "TUNING2026", "FINN40", "KASAI-FW"];
let bluetoothDevice = null;
let fwCharacteristic = null;
let scooterSerial = "N3DGA1111C0001";

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
            const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
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
            filters: [{ namePrefix: "NB-" }, { namePrefix: "Ninebot" }, { namePrefix: "Segway" }],
            optionalServices: [SERVICE_UUID]
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
        document.getElementById("controller-state").textContent = "Verbunden";
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

function createNinebotFrame(command, register, payload = []) {
    const frame = [0x5b, 0xa5, payload.length, command, register, ...payload];
    const checksum = frame.slice(2).reduce((sum, byte) => sum + byte, 0) ^ 0xffff;
    frame.push(checksum & 0xff, (checksum >> 8) & 0xff);
    return new Uint8Array(frame);
}

function checkLicenseCode() {
    const code = document.getElementById("licenseInput").value.trim().toUpperCase();
    const valid = VALID_CODES.includes(code);
    const button = document.getElementById("unlockButton");
    const status = document.getElementById("codeStatus");
    button.disabled = !valid;
    status.textContent = code ? (valid ? "Code gültig" : "Ungültiger Code") : "";
    status.className = `field-hint ${valid ? "valid" : "invalid"}`;
    return valid;
}

async function sendControllerFrame(frame) {
    if (!fwCharacteristic) return false;
    if (fwCharacteristic.properties.writeWithoutResponse) {
        await fwCharacteristic.writeValueWithoutResponse(frame);
    } else {
        await fwCharacteristic.writeValue(frame);
    }
    return true;
}

async function activateProMode() {
    if (!fwCharacteristic) {
        setBluetoothMessage("Bitte zuerst Bluetooth verbinden.", true);
        return;
    }
    if (!checkLicenseCode()) {
        setBluetoothMessage("Bitte einen gültigen Aktivierungscode eingeben.", true);
        return;
    }
    const current = Number(document.getElementById("fwCurrentSlider").value);
    const slope = Number(document.getElementById("fwSlopeSlider").value);
    const serial = new TextEncoder().encode(`N3G${scooterSerial.slice(3)}`);
    try {
        await sendControllerFrame(createNinebotFrame(0x01, 0x10, [...serial]));
        await new Promise((resolve) => setTimeout(resolve, 350));
        await sendControllerFrame(createNinebotFrame(0x01, 0x78, [current & 0xff, slope & 0xff, (slope >> 8) & 0xff]));
        document.getElementById("controller-state").textContent = "Pro aktiv";
        setBluetoothMessage(`Pro-Modus aktiv: ${current} A / Slope ${slope}.`);
    } catch (error) {
        setBluetoothMessage(error.message || "Controller-Befehl konnte nicht gesendet werden.", true);
    }
}

connectButton.addEventListener("click", connectBluetooth);
tuningToggle.addEventListener("change", () => sendFieldWeakening(tuningToggle.checked));
document.getElementById("licenseInput").addEventListener("input", checkLicenseCode);
document.getElementById("fwCurrentSlider").addEventListener("input", (event) => {
    document.getElementById("fwCurrentValue").textContent = `${event.target.value} A`;
});
document.getElementById("fwSlopeSlider").addEventListener("input", (event) => {
    document.getElementById("fwSlopeValue").textContent = event.target.value;
});
document.getElementById("unlockButton").addEventListener("click", activateProMode);

// Kauf-Anfrage
function openPurchase() {

    alert("Bitte melde dich im Discord im Kanal #tickets für die 50km/h Datei oder den Ghost Mode!");
}
