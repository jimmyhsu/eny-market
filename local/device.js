const   Hapi = require('hapi'),
        Joi  = require('joi'),
        Boom = require('boom'),
        Wreck = require('wreck');
const server = new Hapi.Server();
const apiVersion = '/v1'

const SerialPort = require('serialport');
const port = new SerialPort('/dev/cu.usbserial-AL02TQ4P', {
  baudRate: 115200,
  parser: SerialPort.parsers.raw
});

//---------------------- wemo ----------------------\\
const Wemo = require('wemo-client');
const wemo = new Wemo();
let wemoClient; // wemo device client

wemo.discover(function(deviceInfo) {
    // console.log('Wemo Device Found: %j', deviceInfo);

    // Get the client for the found device
    wemoClient = wemo.client(deviceInfo);

    // Handle BinaryState events
    wemoClient.on('binaryState', function(value) {
        console.log('Binary State changed to: %s', value);
    });
});
//---------------------- wemo ----------------------\\

//---------------------- huejay ----------------------\\
const huejay = require('huejay');
huejay.discover().then(bridges => {
    for (let bridge of bridges) {
        console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
    }
}).catch(error => {
    console.log(`An error occurred: ${error.message}`);
});

//4Ba3W-UZFDUVhpFnN7GWFA5ZwhxVn5v83g8XezHS
const huejayClient = new huejay.Client({
    host:     '10.3.16.254',
    port:     80,               // Optional
    username: '4Ba3W-UZFDUVhpFnN7GWFA5ZwhxVn5v83g8XezHS', // Optional
    timeout:  15000,            // Optional, timeout in milliseconds (15000 is the default)
});

let hueUser = new huejayClient.users.User;
hueUser.deviceType = 'MakeSchool';
huejayClient.users.create(hueUser)
.then(user => {
    console.log(`New user created - Username: ${user.username}`);
})
.catch(error => {
    if (error instanceof huejay.Error && error.type === 101) {
      return console.log(`Link button not pressed. Try again...`);
    }
    console.log(error.stack);
});

huejayClient.bridge.isAuthenticated()
.then(() => {
    console.log('Successful authentication');
})
.catch(error => {
    console.log('Could not authenticate');
});
//---------------------- huejay ----------------------\\

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
let currentMode = ''; //current button mode
let isOn = false; // is belkin_switch on?
let hueSettings = {
    brightness: 254,
    hue: 0,
    saturation: 254
}

server.connection({
    port: 2000,
    routes: {
        cors: true
    }
});

// server.route({
//     method: 'GET',
//     path: apiVersion + '/hue/set',
//     handler: function(request, reply) {
//         // if (err) {
//         //     return console.log('Error on write: ', err.message);
//         //     return reply(Boom.badImplementation('Error on write: ', err.message));
//         // }
//         huejayClient.lights.getById(1)
//         .then(light => {
//             light.name = 'Make School';
//
//             light.brightness = 254;
//             light.hue        = 65535; //32554
//             light.saturation = 254;
//
//             return huejayClient.lights.save(light);
//         })
//         .then(light => {
//             console.log(`Updated light [${light.id}]`);
//         })
//         .catch(error => {
//             console.log('Something went wrong');
//             console.log(error.stack);
//         });
//
//         // console.log('Reload Command Received');
//         reply('Reload Command Received');
//     }
// });

server.route({
    method: 'POST',
    path: apiVersion + '/hue/set',
    config: {
        validate: {
            payload: {
                brightness: Joi.number().required(),
                hue: Joi.number().required(),
                saturation: Joi.number().required(),
            }
        },
        handler: function(req, reply) {
            console.log(req.payload);
            hueSettings.brightness = req.payload.brightness;
            hueSettings.hue        = req.payload.hue; //32554
            hueSettings.saturation = req.payload.saturation;
            reply('hueSettings are now: ' + JSON.stringify(hueSettings));
        }
    }
});

server.route({
    method: 'POST',
    path: apiVersion + '/eny/mode',
    config: {
        validate: {
            payload: {
                mode: Joi.required()
            }
        },
        handler: function(req, reply) {
            console.log(req.payload)
            currentMode = req.payload.mode;
            reply('currentMode is now: ' + currentMode)
        }
    }
});

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
        // just for hackathon purposes
        if (currentMode === 'belkin_switch') {
            if (isOn == true) {
                isOn = false;
                wemoClient.setBinaryState(0);
            } else {
                isOn = true;
                wemoClient.setBinaryState(1);
            }
            console.log('isOn: ' + isOn);
        } else if (currentMode === 'hue') {
            huejayClient.lights.getById(1)
            .then(light => {
                light.name = 'Make School';

                light.brightness = getRandomInt(0,255); //hueSettings.brightness;
                light.hue        = getRandomInt(0,65535);//hueSettings.hue; //32554
                light.saturation = getRandomInt(0,255);//hueSettings.saturation;

                return huejayClient.lights.save(light);
            })
            .then(light => {
                console.log(`Updated light [${light.id}]`);
            })
            .catch(error => {
                console.log('Something went wrong');
                console.log(error.stack);
            });
        } else {
            console.log('No Mode Set!');
        }
    }
});

// open errors will be emitted as an error event
port.on('error', function(err) {
    console.log('Error: ', err.message);
})

server.start(function () { // start the Hapi server on your localhost
    console.log('Now Visit: http://localhost:' + server.info.port);
});
