const   Hapi = require('hapi'),
        Joi  = require('joi'),
        Boom = require('boom'),
        Wreck = require('wreck');
const server = new Hapi.Server();

const SerialPort = require('serialport');
const port = new SerialPort('/dev/cu.usbserial-AL02TQ4P', {
  baudRate: 115200,
  parser: SerialPort.parsers.raw
});
// SerialPort.list(function (err, ports) {
//     ports.forEach(function(port) {
//         console.log(port.comName);
//         console.log(port.pnpId);
//         console.log(port.manufacturer);
//     });
// });
const Wemo = require('wemo-client');
const wemo = new Wemo();
let wemoClient; // wemo device client

const hue = require("node-hue-api");
const displayHueBridges = function(bridge) {
    console.log("Hue Bridges Found: " + JSON.stringify(bridge));
};
const displayUserResult = function(result) {
    console.log("Created user: " + JSON.stringify(result));
};

// var hostname = "192.168.2.129",
//     username = "08a902b95915cdd9b75547cb50892dc4",
//     api;
//
// api = new HueApi(hostname, username);

wemo.discover(function(deviceInfo) {
    console.log('Wemo Device Found: %j', deviceInfo);

    // Get the client for the found device
    wemoClient = wemo.client(deviceInfo);

    // Handle BinaryState events
    wemoClient.on('binaryState', function(value) {
        console.log('Binary State changed to: %s', value);
    });
    // let isOn = false;

    // Turn the switch on
    // wemoClient.setBinaryState(1);
    // setInterval(function () {
    //     if (isOn == true) {
    //         isOn = false;
    //         wemoClient.setBinaryState(0);
    //     } else {
    //         isOn = true;
    //         wemoClient.setBinaryState(1);
    //     }
    // }, 10000);
});

const   hostname = "10.3.17.7",
        userDescription = "Team Make School";

hue.nupnpSearch(function(err, result) {
    if (err) throw err;
    displayHueBridges(result);
});

const HueApi = hue.HueApi
var hueApiTest = new HueApi();

hueApiTest.createUser(hostname, function(err, user) {
    if (err) throw err;
    displayUserResult(user);
});

server.connection({
    port: 2000,
    routes: {
        cors: true
    }
});

let isOn = false;

port.on('data', function (data) {
    console.log('Data: ' + data);
    // Wreck.get('http://localhost:3000/v1/app/test', (err, res, payload) => {
    //     // console.log('something!');
    //     if (err) {
    //         console.log('err: ' + err);
    //     }
    //     console.log('payload: ' + payload);
    // });
    if (data.includes('rcv ok : ')) {
        if (isOn == true) {
            isOn = false;
            wemoClient.setBinaryState(0);
        } else {
            isOn = true;
            wemoClient.setBinaryState(1);
        }
        console.log('isOn: ' + isOn);
    }
});

// open errors will be emitted as an error event
port.on('error', function(err) {
    console.log('Error: ', err.message);
})

server.start(function () { // start the Hapi server on your localhost
    console.log('Now Visit: http://localhost:' + server.info.port);
});
