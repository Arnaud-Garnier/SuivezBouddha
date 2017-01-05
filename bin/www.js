#!/usr/bin/env node

/**
 * Module dependencies.
 */

 var app = require('../app');
 var debug = require('debug')('ihm-web:server');
 var http = require('http');
 var fs = require('fs');

/**
* Get port from environment and store in Express.
*/

var port = normalizePort(process.env.PORT || '8080');
app.set('port', port);

/**
* Create HTTP server.
*/

var server = http.createServer(app);

/**
* Create Socket.IO
*/

var io = require('socket.io').listen(server);

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    console.log('New Client');

    // Quand un message arrive, on le note dans la console
    socket.on('message', function (msg) {
        console.log('Message received : '+ msg);
    });

    socket.on('askDirection', function (directionId) {
        console.log("Direction asked (id : " + directionId + ")");
        fs.readFile('ressources/directions.json', 'utf8', function (err, data) {
            if (err) throw err;
            var directions = JSON.parse(data).directions;
            for(var i = 0; i < directions.length; i++){
                if(directions[i].id == directionId){
                    console.log("Position found (id : " + directionId + ")");
                    socket.emit('newDirection', directions[i]);
                }
            }
        });
    });

    socket.on('askPosition', function (positionId) {
        console.log("Position asked (id : " + positionId + ")");
        fs.readFile('ressources/positions.json', 'utf8', function (err, data) {
            if (err) throw err;
            var positions = JSON.parse(data).positions;
            for(var i = 0; i < positions.length; i++){
                if(positions[i].id == positionId){
                    console.log("Position found (id : " + positionId + ")");
                    socket.emit('newDirection', positions[i]);
                }
            }
        });
    });

    // fs.readFile('ressources/directions.json', 'utf8', function (err2, data2) {
    //                     if (err2) throw err2;
    //                     obj2 = JSON.parse(data2);
    //                     for(var j = 0; j < obj2.directions.length; j++) {
    //                         if (obj2.directions[j].id === positionId){
    //                             answer.direction = obj2.directions[j];
    //                             console.log("answer: "+JSON.stringify(answer));
    //                             socket.emit('newDirection', answer);
    //                         }
    //                     }
    //                 });

    socket.on('askAllRooms', function (positionId) {
        console.log('All rooms asked');  
        var obj;
        fs.readFile('ressources/rooms.json', 'utf8', function (err, data) {
            if (err) throw err;
            socket.emit('allRooms', data);
        });
    });
});

/**
* Listen on provided port, on all network interfaces.
*/

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
* Normalize a port into a number, string, or false.
*/

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
* Event listener for HTTP server "error" event.
*/

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
        case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
        default:
        throw error;
    }
}

/**
* Event listener for HTTP server "listening" event.
*/

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;

    console.log('Listening on ' + bind);
}
