var events 	= require('events');
var net 	= require('net');
var util 	= require('util');

var mysql 	= require('mysql');
var foreach = require('foreach');

var connection = null;

var MySQLHandleError = function(err){
	console.log(err.code);
	
	switch(err.code)
	{
		case 'PROTOCOL_CONNECTION_LOST':
		break;
		case 'ECONNREFUSED':
			//startConnection();
		break;
		case 'ECONNRESET':
			startConnection();
			//console.log('MySQL: lost connecnt (ECONNRESET)');
		break;
	}
};

var startConnection = function(){

	connection = mysql.createConnection({
		host		: '127.0.0.1',
		port		: 3306,
		user		: 'root',
		password	: '',
		database	: 'gpstracker'
	});

	connection.connect(function(err) {
		if (err) {
			//console.error('error connecting: ' + err.stack);
			MySQLHandleError(err);
			return false;
		}

		console.log('connected as id ' + connection.threadId);
	});

	connection.on('error', MySQLHandleError);
};


startConnection();


/***********************************************************************/

var channel = new events.EventEmitter();
channel.clients = {};

channel.on('join', function(client, data) {
	var imei = data.match(/##,imei:(\d+),A;/);

	if (imei != null) {
		imei = imei[1];

		connection.query(util.format("SELECT COUNT(imei) AS device FROM device WHERE imei = '%s'", imei), function(err, rows){
			if (err) {
				MySQLHandleError(err);
				return false;
			}

			// Bypass authen for test load
			channel.emit('authen', imei, client);
			/*if (parseInt(rows[0].device) > 0) {
				channel.emit('authen', imei, client);
			}
			else {
				client.destroy();
				console.log('DeviceID: ' + imei + ' Authentication failed');
			}*/
		});
		
	} else {
		client.destroy();
	}

});

channel.on('authen', function(imei, client) {
	this.clients[imei] = client;
	client.write('LOAD');
	console.log('DeviceID: ' + imei + ' Online');
});

channel.on('tracker', function(data) {
	var raw = data.match(/imei:(\d+),([^,]+),(\d{2})?(\d{2})?(\d{2})\s?(\d{2}):?(\d{2})(?:\d{2})?,[^,]*,[FL],(?:(\d{2})(\d{2})(\d{2}).(\d+)|(?:\d{1,5}.\d+)),([AV]),(?:([NS]),)?(\d+)(\d{2}.\d+),(?:([NS]),)?(?:([EW]),)?(\d+)(\d{2}.\d+),(?:([EW])?,)?(\d+\.?\d*)?,?(\d+.?\d*)?,?(\d+.?\d*)?,?([^,;]+)?,?([^,;]+)?,?([^,;]+)?,?([^,;]+)?,?([^,;]+)?,?.*/);

	if (raw == null) return false;

	connection.query(util.format('INSERT INTO logtracking (imei, latitude, longitude, speed) VALUES ( \'%s\', %s, %s, %s)',
		raw[1],
		(parseFloat(raw[14]) + (parseFloat(raw[15]) / 60)).toFixed(6),
		(parseFloat(raw[18]) + (parseFloat(raw[19]) / 60)).toFixed(6),
		parseInt(raw[21])
	), function(err, rows){
		if (err)
		{
			MySQLHandleError(err);
			return;
		}
	});
});

channel.on('command', function(imei, command) {
	this.clients[imei].write(command);
	console.log('COMMAND: DeviceID' + imei + ' > ' + command);
});

var server = net.createServer(function (client) {
	var id = client.remoteAddress + ':' + client.remotePort;

	client.on('data', function(data) {
		data = data.toString();

		//console.log('LOG: ' + data);
		console.log('Current Connection: ' + Object.keys(channel.clients).length);
		/*console.log(channel.clients);
		console.log(id);*/

		if (data.indexOf('##') > -1) {
			channel.emit('join', client, data);
			return true;
		}
		
		if (data.indexOf('tracker') > -1) {
			channel.emit('tracker', data);
			return true;
		}

		var heartbeat = data.match(/(\d{15});/);
		if (heartbeat != null && typeof channel.clients[heartbeat[1]] !== 'undefined') {
			client.write('ON');
			console.log('Heartbeat::' + heartbeat[1]);
			return true;
		}

	});

	client.on('error', function(err) {
		if (err)
		{
		}
	});

	client.on('close', function() {
		foreach(channel.clients, function(value, imei, object){
			//console.log(key, value._peername);
			//console.log(client._peername.address);

			if (value._peername.address == client._peername.address && 
				value._peername.port 	== client._peername.port)
			{
				delete channel.clients[imei];
			}
		});

		console.log('Current Connection: ' + Object.keys(channel.clients).length);
	});

}).listen(1234);
