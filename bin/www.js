#!/usr/bin/env node

/**
 * Module dependencies.
 */

 var app = require('../app');
 var debug = require('debug')('ihm-web:server');
 var http = require('http');
 var fs = require('fs');
 var graphModule = require("./graph");

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
        })
    })
    return promise;
}

/**
* Read file
*/
function getRoomIndex(rooms, room) {
    var promise = new Promise(function(resolve, reject) {
        for(var i = 0; i < rooms.length; i++){
            if(rooms[i].number == room.number){
                console.log("room index found : " + i);
                resolve(i);
                return;
            }
        }
        reject();
    });
    return promise;
}

function getFloorIndex(floors, floor) {
    console.log("Floor to search : " + floor);
    console.log("Floors : " + floors);
    var promise = new Promise(function(resolve, reject) {
        for(var i = 0; i < floors.length; i++) {
            if(floors[i].name == floor){
                console.log("floor index found : " + i);
                resolve(i);
                return;
            }
        }
        reject();
    })
    return promise;
}

/**
* Add room
*/
function addRoom(rooms, room) {
    var promise = new Promise(function(resolve, reject) {
        var i = 0;
        console.log(room);
        console.log(rooms);
        while(rooms.length > i && room.number > rooms[i].number){
            console.log(i + " : ")
            console.log(JSON.stringify(rooms[i]));
            i++;
        }
        console.log("While end");
        rooms.splice(i, 0, room);
        console.log(rooms);
        resolve(rooms);
    });
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

    function sendRooms() {
        readFile('ressources/rooms.json').then(
            function(data) {
                console.log("Emit : " + JSON.stringify(data));
                socket.emit('allRooms', data);
            })
    }

    // Quand un message arrive, on le note dans la console
    socket.on('message', function (msg) {
        console.log('Message received : '+ msg);
    });

    socket.on('askDirection', function (from, to) { //roomId, directionId

        var finish = false;
        var data = graphModule.graph.getPath( from, to );
        console.log( "Chemin entier : "+data.path );
        var chemin = data.path[0] +'-'+ data.path[1];

        if(data.path[1] == to) {
            finish = true;
        }

        fs.readFile('ressources/directions2.json', 'utf8', function (err, data) {
            if (err) throw err;
            console.log("File ressources/directions.json open");

            var directions2 = JSON.parse(data).directions;
            for (var y = 0; y < directions2.length; y++) {

                if (directions2[y].direction == chemin) {
                    console.log("Chemin trouvé (" + chemin + ")");

                    directions2 = JSON.stringify(directions2[y]);
                    var directions = JSON.parse(directions2).data;

                    console.log("Emit : " + JSON.stringify(directions), finish);
                    socket.emit('newDirection', directions, finish);
                }
            }
        });
        
        /*
        console.log("------------------");
        console.log("Room asked (id : " + roomId + ")");
        console.log("Direction asked (id : " + directionId + ")");
        fs.readFile('ressources/directions.json', 'utf8', function (err, data) {
            if (err) throw err;
            console.log("File ressources/directions.json open");
            var directions2 = JSON.parse(data).directions;
            for(var y = 0; y < directions2.length; y++){

                if (directions2[y].roomID == roomId) {
                    console.log("Room found (id : " + roomId + ")");
                    
                    directions2 = JSON.stringify(directions2[y]);
                    var directions = JSON.parse(directions2).directions;

                    for (var i = 0; i < directions.length; i++) {
                        if (directions[i].id == directionId) {
                            console.log("Direction found (id : " + directionId + ")");
                            console.log("Emit : " + JSON.stringify(directions[i]));
                            socket.emit('newDirection', directions[i]);
                            break;
                        }
                    }
                }
            }
        });
        */
        
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


    socket.on('askAllRooms', function () {
        console.log("------------------");
        console.log('All rooms asked');
        sendRooms();
    });

    socket.on('setRoom', function(data){
        var room = data.room;
        var floor = data.floor;
        console.log("------------------");
        console.log("Setting room : " + room.number);
        readFile('ressources/rooms.json').then(
            function(floors){
                var floors = JSON.parse(floors);
                getFloorIndex(floors, floor).then(function(floorIndex){
                    getRoomIndex(floors[floorIndex].rooms, room).then(function(roomIndex) {
                        console.log(floors[floorIndex].rooms[roomIndex]);
                        floors[floorIndex].rooms[roomIndex] = room;
                        console.log(floors[floorIndex].rooms[roomIndex]);
                        writeFile('ressources/rooms.json', JSON.stringify(floors)).then(
                            function(){
                                console.log("Emit : roomEdition")
                                socket.emit("roomEdition", "Room " + room.number + " edition success!");
                            }, function() {
                                console.log("Emit : roomEdition")
                                socket.emit("roomEdition", "Room " + room.number + " edition fail!");
                            });
                    });
                });
            });

    });

    socket.on('removeRoom', function(room) {
        console.log("------------------");
        console.log("Removing room : " + room.number);
        readFile('ressources/rooms.json').then(
            function(data){
                var data = JSON.parse(data);
                getRoomIndex(data.rooms, room).then(function(index) {
                    data.rooms.splice(index, 1);
                    writeFile('ressources/rooms.json', JSON.stringify(data)).then(
                        function(){
                            console.log("Emit : roomDeletion")
                            socket.emit("roomDeletion", "Room " + room.number + " deletion success!");
                            sendRooms();
                        }, function() {
                            console.log("Emit : roomDeletion")
                            socket.emit("roomDeletion", "Room " + room.number + " deletion fail!");
                        });

                });
            })
    });

    socket.on('addRoom', function(room){
        console.log("------------------");
        console.log("Adding room : " + room.number);
        readFile('ressources/rooms.json').then(
            function(data){
                var data = JSON.parse(data);
                addRoom(data.rooms, room).then(function(rooms){
                    data.rooms = rooms;
                    writeFile('ressources/rooms.json', JSON.stringify(data)).then(
                        function(){
                            console.log("Emit : roomAddition");
                            socket.emit("roomAddition", "Room " + room.number + " addition success!");
                        }, function() {
                            console.log("Emit : roomAddition");
                            socket.emit("roomAddition", "Room " + room.number + " addition fail!");
                        });
                });
            })
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

/*
var from = '4';
var to = '6';
var finish = false;
var data = graphModule.graph.getPath( from, to );
console.log( data.path[0] +'-'+ data.path[1] );
var chemin = data.path[0] +'-'+ data.path[1];

if(data.path[1] == to) {
    finish = true;
}

fs.readFile('ressources/directions2.json', 'utf8', function (err, data) {
    if (err) throw err;
    console.log("File ressources/directions.json open");

    var directions2 = JSON.parse(data).directions;
    for (var y = 0; y < directions2.length; y++) {

        if (directions2[y].direction == chemin) {
            console.log("Chemin trouvé (" + chemin + ")");

            directions2 = JSON.stringify(directions2[y]);
            var directions = JSON.parse(directions2).data;
            
            console.log("Emit : " + JSON.stringify(directions), finish);
            //socket.emit('newDirection', directions, finish);
        }
    }
});
 */
