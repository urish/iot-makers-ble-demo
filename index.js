let bulbCharacteristic;

const ThingyMotionService = 'ef680400-9b35-4933-9b10-52ffa9740042';
const ThingyMotionDataCaracteristic = 'ef680406-9b35-4933-9b10-52ffa9740042';
const powerBar = document.querySelector('#powerBar');
let powerCounter = 0;

async function setColor(r, g, b) {
  if (bulbCharacteristic) {
    try {
      return await bulbCharacteristic.writeValue(new Uint8Array([b, g, r]));
    } catch (e) {}
  }
}

function startGame() {
  powerCounter = 0;
  let seconds = 0;
  console.log('Game started!');
  const timer = setInterval(() => {
    if (seconds === 10) {
      document.querySelector('h1').innerText =
        'Score: ' + powerCounter.toFixed(2);
      clearInterval(timer);
      return;
    }
    seconds++;
    console.log(
      'Time left: %c' + (10 - seconds),
      'color: red; font-weight: bold; font-size: 100px;'
    );
  }, 1000);
}

async function connectBulb() {
  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [0xffb0] }]
  });
  await device.gatt.connect();
  const service = await device.gatt.getPrimaryService(0xffb0);
  bulbCharacteristic = await service.getCharacteristic(0xffb2);
  console.log('Ready');
}

async function connectThingy() {
  const device = await navigator.bluetooth.requestDevice({
    filters: [
      {
        namePrefix: 'Thingy'
      }
    ],
    optionalServices: [ThingyMotionService]
  });
  await device.gatt.connect();
  const service = await device.gatt.getPrimaryService(ThingyMotionService);
  const motionCharacteristic = await service.getCharacteristic(
    ThingyMotionDataCaracteristic
  );
  motionCharacteristic.addEventListener('characteristicvaluechanged', () => {
    const { value } = motionCharacteristic;
    const accelX = value.getInt16(0, true) / 1000.0;
    const accelY = value.getInt16(2, true) / 1000.0;
    const accelZ = value.getInt16(4, true) / 1000.0;
    const totalPower = Math.abs(
      Math.sqrt(accelX ** 2 + accelY ** 2 + accelZ ** 2) - 1
    );
    powerCounter += Math.abs(totalPower);
    // console.log(accelX, accelY, accelZ, totalPower);
    powerBar.style.width = Math.round(totalPower * 20) + '%';
    setColor(Math.round(255 - totalPower * 100), parseInt(totalPower * 100), 0);
  });
  await motionCharacteristic.startNotifications();
}
