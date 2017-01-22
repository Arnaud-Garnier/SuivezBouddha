//https://www.npmjs.com/package/directions
var directions = require( 'directions' );

var graph = directions();

graph.fromTo( '1', '2', 1 );
graph.fromTo( '2', '1', 1 );

graph.fromTo( '2', '3', 1 );
graph.fromTo( '3', '2', 1 );

graph.fromTo( '3', '4', 1 );
graph.fromTo( '4', '3', 1 );

graph.fromTo( '4', '6', 1 );
graph.fromTo( '6', '4', 1 );

graph.fromTo( '3', '5', 1 );
graph.fromTo( '5', '3', 1 );

graph.fromTo( '5', '7', 1 );
graph.fromTo( '7', '5', 1 );


module.exports.graph = graph;




