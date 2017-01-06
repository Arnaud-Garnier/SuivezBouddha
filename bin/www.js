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
* Write file
*/
function writeFile (path, value) {
    var promise = new Promise(function(resolve, reject) {
        fs.writeFile(path, value, function(err) {
            if(err) {
                reject(err);
            } else {
                console.log("File " + path + " saved");
                resolve();
            }
        }); 
    });
    return promise;
}

/**
* Read file
*/
function readFile (path) {
    var promise = new Promise(function(resolve, reject) {
        fs.readFile(path, 'utf8', function (err, data) {
            if(err) {
                reject();
            } else {
                console.log("File " + path + " red");
                resolve(data);
            }
        }
        )
    })
    return promise;
}

/**
* Create Socket.IO
*/

var io = require('socket.io').listen(server);

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    console.log("------------------");
    console.log('New Client');

    // Quand un message arrive, on le note dans la console
    socket.on('message', function (msg) {
        console.log('Message received : '+ msg);
    });

    socket.on('askDirection', function (directionId) {
        console.log("------------------");
        console.log("Direction asked (id : " + directionId + ")");
        fs.readFile('ressources/directions.json', 'utf8', function (err, data) {
            if (err) throw err;
            console.log("File ressources/directions.json open");
            var directions = JSON.parse(data).directions;
            for(var i = 0; i < directions.length; i++){
                if(directions[i].id == directionId){
                    console.log("Direction found (id : " + directionId + ")");
                    console.log("Emit : " + JSON.stringify(directions[i]));
                    socket.emit('newDirection', directions[i]);
                    break;
                }
            }
        });
    });

    socket.on('askPosition', function (positionId) {
        console.log("------------------");
        console.log("Position asked (id : " + positionId + ")");
        readFile('ressources/positions.json').then(
            function(data) {
                var positions = JSON.parse(data).positions;
                for(var i = 0; i < positions.length; i++){
                    if(positions[i].id == positionId){
                        console.log("Position found (id : " + positionId + ")");
                        console.log("Emit : " + JSON.stringify(positions[i]));
                        socket.emit('newPosition', positions[i]);
                        break;
                    }
                }
            })
    });


    socket.on('askAllRooms', function (positionId) {
        console.log("------------------");
        console.log('All rooms asked');
        readFile('ressources/rooms.json').then(
            function(data) {
                console.log("Emit : " + JSON.stringify(data));
                socket.emit('allRooms', data);
            })
    });

    socket.on('setRoom', function(room){
        console.log("------------------");
        console.log("Setting room : " + room.number);
        readFile('ressources/rooms.json').then(
            function(data){
                var data = JSON.parse(data);
                for(var i = 0; i < data.rooms.length; i++){
                    console.log(data.rooms[i]);
                    if(data.rooms[i].number == room.number){
                        console.log("Room " + room.number + " found");
                        data.rooms[i] = room;
                        writeFile('ressources/rooms.json', JSON.stringify(data)).then(
                            function(){
                                console.log("Emit : roomEdition")
                                socket.emit("roomEdition", "Room " + room.number + " edition success!");
                            }, function() {
                                console.log("Emit : roomEdition")
                                socket.emit("roomEdition", "Room " + room.number + " edition fail!");
                            });
                        break;
                    }
                }
            });

    })
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
