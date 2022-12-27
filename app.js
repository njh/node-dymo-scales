const HID = require('node-hid')
const usb = require('usb')

let reading = false
let interval
const vid = 0x922
const pid = 0x8003

// try to connect to the scale if available
startReading()

usb.on('attach', function (device) {
  if (device.deviceDescriptor.idVendor === vid && device.deviceDescriptor.idProduct === pid) {
    console.log('Dymo M10 attached')

    interval = setInterval(startReading, 1000)
  }
})

usb.on('detach', function (device) {
  if (device.deviceDescriptor.idVendor === vid && device.deviceDescriptor.idProduct === pid) {
    console.log('Dymo M10 detached')
    reading = false
    clearInterval(interval)
  }
})

function startReading () {
  if (reading) return
  try {
    const d = new HID.HID(vid, pid)

    console.log('Starting to read data from scale')
    reading = true

    d.on('data', function (data) {
      const buf = Buffer.from(data)
      const grams = buf[4] + (256 * buf[5])
      console.log(new Date().toISOString() + ': ' + grams + ' grams')
    })

    d.on('error', function (error) {
      console.log(error)
      reading = false
      d.close()
    })
  } catch (err) {
    if (/cannot open device/.test(err.message)) {
      console.log('Dymo M10 cannot be found')
    } else { console.log(err) }
  }
}
