"use strict";
var bone = require( "bonescript" );
const server = "192.168.0.41",
	configMap = [ {
		id: "orange-84d398dd86e3",
		pin: "P8_7",
		type: "button",
		validCmds: [ "on", "off", "getState" ],
		meta: {
			usage: "Mains Relay",
			color: "Orange"
		}

	}, {
		id: "blue-84d398dd86e3",
		pin: "P8_8",
		type: "button",
		validCmds: [ "on", "off", "getState" ],
		meta: {
			usage: "Mains Relay",
			color: "Blue"
		}

	}, {
		id: "green-84d398dd86e3",
		pin: "P8_9",
		type: "button",
		validCmds: [ "on", "off", "getState" ],
		meta: {
			usage: "Mains Relay",
			color: "Green"
		}

	}, {
		id: "red-84d398dd86e3",
		pin: "P8_10",
		type: "button",
		validCmds: [ "on", "off", "getState" ],
		meta: {
			usage: "Mains Relay",
			color: "Red"
		}

	}, {
		id: "yellow-84d398dd86e3",
		pin: "P8_11",
		type: "button",
		validCmds: [ "on", "off", "getState" ],
		meta: {
			usage: "Mains Relay",
			color: "Yellow"
		}

	}, {
		id: "purple-84d398dd86e3",
		pin: "P8_12",
		type: "button",
		validCmds: [ "on", "off", "getState" ],
		meta: {
			usage: "Mains Relay",
			color: "Purple"
		}

	}, {
		id: "white-84d398dd86e3",
		pin: "P8_14",
		type: "button",
		validCmds: [ "on", "off", "getState" ],
		meta: {
			usage: "Mains Relay",
			color: "White"
		}

	}, {
		id: "black-84d398dd86e3",
		pin: "P8_16",
		type: "button",
		validCmds: [ "on", "off", "getState" ],
		meta: {
			usage: "Mains Relay",
			color: "Black"
		}

	}, ],
	WebSocket = require( "ws" );
var WebSock = {};

function configGen( config ) {
	let ret = [];
	config.forEach( ( el ) => {
		let t = {
			device: el.id,
			type: el.type,
			validCmds: el.validCmds,
			meta: el.meta
		};
		ret.push( t );
	} );
	return ret;
}

function button( d, cmd ) {
	if ( bone.getPinMode( d.pin )
		.gpio.direction !== "out" ) {
		bone.pinMode( d.pin, bone.OUTPUT, ( d ) => {
			console.log( `Setting ${d.pin} to Output` )
		} );
	}
	switch ( cmd ) {
		case "on":
			{
				bone.digitalWrite( d.pin, 1 );
				button( d, "getState" );
				break;
			}
		case "off":
			{
				bone.digitalWrite( d.pin, 0 );
				button( d, "getState" );
				break;
			}
		case "getState":
			{
				let retMsg = [ "state", {
					device: d.id,
					mode: bone.getPinMode( d.pin )
						.gpio,
					value: bone.digitialRead( d.pin )
				} ];
				WebSock.send( JSON.stringify( retMsg ) );
				break;
			}
		default:
			{
				break;
			}
	}
}

function dimmer( d, cmd ) {
	switch ( cmd ) {
		case "read":
			{
				WebSock.send( JSON.stringify( [ "reading", {
					device: d.device,
					value: analogRead()
				} ] ) );
			}
			break;
		case "expression":

			break;
		default:

	}
	//analogRead();
	// on ESP8266, only one pin is analog, so it's not named.
	// TODO: implement this in the configMap device, so it can have a read
	// or write. Note that write is only simulated via toggeling a gpio.
}

function virtual( d, cmd ) {
	d.pin( cmd );
}

function msgParse( msg ) {
	let m = JSON.parse( msg );
	let device = ( map ) => {
		for ( let x = 0; x < map.length; x++ ) {
			if ( map[ x ].id === m[ 1 ].device ) {
				return map[ x ];
			}
		}
	};
	switch ( m[ 0 ] ) {
		case "cmd":
			{
				let d = device( configMap );
				switch ( d.type ) {
					case "button":
						{
							button( d, m[ 1 ].cmd );
							break;
						}
					case "virtual":
						{
							virtual( d, m[ 1 ].cmd );
							break;
						}
					case "dimmer":
						{
							dimmer( d, m[ 1 ].cmd );
							break;
						}
					default:
						break;
				}
				break;
			}
		case "config":
			{
				WebSock.send( JSON.stringify( [ "config", configGen( configMap ) ] ) );
				break;
			}
		default:
			break;

	}
}

function WebSockconnect( state ) {
	console.log( "Creating the websocket..." );
	if ( state === 1 ) {
		WebSock.removeAllListeners();
		WebSock = null;
	}
	WebSock = new WebSocket( "ws://" + server, {
		path: "/ws/device",
		port: 1880,
		origin: "BeagleBoneBlack",
		keepAlive: 60
	} );
	WebSock.on( "open", () => {
		WebSock.send( JSON.stringify( [ "config", configGen( configMap ) ] ) );
		console.log( "[SUCCESS] WebSocket connected." );
	} );
	WebSock.on( "close", () => {
		console.log( "[ERROR] WebSocket closed - reconnecting..." );
		WebSockconnect( 1 );
	} );
	WebSock.on( "message", ( msg ) => {
		msgParse( msg.toString() );
	} );
}

configMap.forEach( ( d ) => {
	bone.pinMode( d.pin, bone.OUTPUT, ( d ) => {
		console.log( `Setting ${d.pin} to Output` )
	} );
} );

WebSockconnect( 0 );
