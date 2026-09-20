const $ = (id) => document.getElementById(id);

let bleDevice = null;
let gattCharacteristic = null;

const BLE_SERVICE_UUIDS = [
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
];

function setBleConnection(connected, message) {
  const status = $('connection-status');
  const button = $('btn-connect');
  if (!status || !button) return;
  status.className = `status-pill ${connected ? 'status-connected' : 'status-disconnected'}`;
  status.textContent = connected ? '● BLE verbunden' : '● Nicht verbunden';
  button.textContent = connected ? 'BLE trennen' : 'Scooter verbinden';
  if (message) log(message);
}

async function connectBluetooth() {
  if (!('bluetooth' in navigator)) {
    log('Web Bluetooth wird von diesem Browser nicht unterstützt');
    alert('Bitte Chrome oder Bluefy über HTTPS verwenden.');
    return;
  }

  try {
    bleDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: BLE_SERVICE_UUIDS,
    });
    bleDevice.addEventListener('gattserverdisconnected', () => {
      gattCharacteristic = null;
      setBleConnection(false, 'BLE-Verbindung getrennt');
    });

    const server = await bleDevice.gatt.connect();
    const services = await server.getPrimaryServices();
    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      gattCharacteristic = characteristics.find((characteristic) =>
        characteristic.properties.write || characteristic.properties.writeWithoutResponse,
      );
      if (gattCharacteristic) break;
    }

    if (!gattCharacteristic) {
      throw new Error('Keine schreibbare BLE-Charakteristik gefunden');
    }
    setBleConnection(true, `${bleDevice.name || 'Scooter'} verbunden`);
  } catch (error) {
    gattCharacteristic = null;
    setBleConnection(false);
    if (error.name !== 'NotFoundError') {
      log(`BLE-Fehler: ${error.message}`);
      alert(`BLE-Verbindung fehlgeschlagen: ${error.message}`);
    }
  }
}

async function disconnectBluetooth() {
  if (bleDevice?.gatt?.connected) bleDevice.gatt.disconnect();
  gattCharacteristic = null;
  setBleConnection(false, 'BLE-Verbindung getrennt');
}

const outputMap = { 'iqfw-range':['iqfw-val',' A'], 'engage-range':['engage-val',' km/h'], 'scale-range':['scale-val',''], 'fw-amp-range':['fw-amp-val',' A'], 'fw-cap-range':['fw-cap-val',' A'], 'fw-startspeed-range':['fw-startspeed-val',' km/h'], 'fw-ramp-range':['fw-ramp-val',' mA/km/h'], 'overdrive-range':['overdrive-val',' %'], 'tacho-range':['tacho-val',''] };
Object.entries(outputMap).forEach(([inputId,[outputId,suffix]]) => { const input=$(inputId), output=$(outputId); if(!input||!output)return; const update=()=>output.textContent=`${input.value}${suffix}`; input.addEventListener('input',update); update(); });
const terminal=$('terminal-out');
function log(message){ if(!terminal)return; const line=document.createElement('div'); line.textContent=`[action] ${message}`; terminal.appendChild(line); terminal.scrollTop=terminal.scrollHeight; }
function setConnection(connected){ const status=$('connection-status'); if(!status)return; status.className=`status-pill ${connected?'status-connected':'status-disconnected'}`; status.textContent=connected?'● Verbunden':'● Nicht verbunden'; }
$('btn-connect')?.addEventListener('click', async () => {
  if (bleDevice?.gatt?.connected) {
    await disconnectBluetooth();
  } else {
    await connectBluetooth();
  }
});
$('btn-sim')?.addEventListener('click',(event)=>{ event.currentTarget.textContent='Simulation aktiv'; setConnection(true); log('Simulation aktiv - keine Hardware verbunden'); });
$('btn-clear-term')?.addEventListener('click',()=>{ if(terminal)terminal.textContent=''; });
$('btn-panic')?.addEventListener('click',()=>{ $('police-mode').checked=false; document.querySelectorAll('.switch input').forEach((input)=>{if(input.id!=='iqfw-toggle')input.checked=false}); log('Sicherheitsmodus zurückgesetzt'); });
$('btn-flash-mcu')?.addEventListener('click',()=>log('MCU-Parameter vorbereitet (Simulation)'));
$('btn-welcome-seq')?.addEventListener('click',()=>log('Welcome-Sequenz vorbereitet (Simulation)'));
document.querySelectorAll('.action-buttons-stack .btn').forEach((button)=>button.addEventListener('click',()=>log(`${button.textContent.trim()} ausgeführt`)));
document.querySelectorAll('.checkbox-item input,.switch input,.matrix-box input').forEach((input)=>input.addEventListener('change',()=>log(`${input.id||'Matrixwert'} geändert`)));
