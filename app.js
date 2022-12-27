const HID = require('node-hid')
const usbDetect = require('usb-detection')

const dymoVid = 0x0922
const m10Pid = 0x8003

let reading = false
let interval = null

usbDetect.on('add', function (device) {
  if (device.vendorId === dymoVid && device.productId === m10Pid) {
    console.log('Dymo M10 attached')

    interval = setInterval(startReading, 1000)
  }
})

usbDetect.on('remove', function (device) {
  if (device.vendorId === dymoVid && device.productId === m10Pid) {
    console.log('Dymo M10 detached')
    clearInterval(interval)
    reading = false
  }
})

usbDetect.startMonitoring()

// See if device is already connected
usbDetect.find(dymoVid, m10Pid, (err, devices) => {
  if (err) {
    console.error(err)
  } else if (devices.length > 0) {
    startReading()
  } else {
    console.log('Please connect and turn on the Dymo M10 scales')
  }
})

function unitStr (val) {
  switch (val) {
    case 2:
      return 'grams'
    case 11:
      return 'ounces'
    default:
      return '??'
  }
}

function formatData (data) {
  if (data[1] === 2) {
    return 'zero'
  } else {
    const units = unitStr(data[2])
    const rawWeight = data[4] + (256 * data[5])
    const positive = (data[1] === 5) ? -1 : 1
    const factor = data[3] ? 10 : 1
    const weight = (rawWeight * positive) / factor
    return weight + ' ' + units
  }
}

function startReading () {
  if (reading) return
  try {
    const d = new HID.HID(dymoVid, m10Pid)

    console.log('Starting to read data from scale')
    reading = true

    d.on('data', function (data) {
      const date = new Date().toISOString()
      console.log(date + ': ' + formatData(data))
    })

    d.on('error', function (error) {
      console.error(error)
      reading = false
      d.close()
    })
  } catch (err) {
    if (/cannot open device/.test(err.message)) {
      console.error('Dymo M10 cannot be found')
    } else { console.error(err) }
  }
}
