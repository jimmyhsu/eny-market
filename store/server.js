const   Hapi = require('hapi'),
        Joi  = require('joi'),
        Boom = require('boom');
const server = new Hapi.Server();

const apiVersion = "/v1";

// const SerialPort = require('serialport');
// const port = new SerialPort('/dev/cu.usbserial-AL02TQ4P', {
//   baudRate: 115200,
//   parser: SerialPort.parsers.raw
// });
//
// SerialPort.list(function (err, ports) {
//     ports.forEach(function(port) {
//         console.log(port.comName);
//         console.log(port.pnpId);
//         console.log(port.manufacturer);
//     });
// });

server.connection({
    port: 3000,
    routes: {
        cors: true
    }
});

server.route({
    method: 'GET',
    path: apiVersion + '/app/{appName}',
    handler: function(request, reply) {
        // if (err) {
            // return console.log('Error on write: ', err.message);
            // return reply(Boom.badImplementation('Error on write: ', err.message));
        // }
        console.log('Activated ' + request.params.appName);
        reply('Activated ' + request.params.appName);
    }
});

server.route({
    method: 'GET',
    path: apiVersion + '/commit',
    handler: function(request, reply) {
        // if (err) {
        //     return console.log('Error on write: ', err.message);
        //     return reply(Boom.badImplementation('Error on write: ', err.message));
        // }
        console.log('Reload Command Received');
        reply('Reload Command Received');
    }
});

// server.route({
//     method: 'POST',
//     path: apiVersion + '/',
//     config: {
//         validate: {
//             payload: {
//                 x: Joi.number().min(40).max(120).required(),
//                 y: Joi.number().min(85).max(120).required()
//             }
//         },
//         handler: function(req, reply) {
//             console.log(req.payload)
//             var coords = {
//                 x: req.payload.x,
//                 y: req.payload.y
//             };
//         }
//     }
// });

server.start(function () { // start the Hapi server on your localhost
    console.log('Now Visit: http://localhost:' + server.info.port);
});
