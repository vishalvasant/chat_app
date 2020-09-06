var fs = require( 'fs' );

var env_array = { };
var env_file_lines = fs.readFileSync( '.env', 'utf-8' ).split( /\r?\n/ );
env_file_lines.forEach( function ( line ) {
	line = line.trim();
	if ( line == '' || line.charAt( 0 ) == '#' ) {
		return;
	}
	var equal_pos = line.indexOf( '=' );
	if ( equal_pos > 0 ) {
		env_array[line.substr( 0, equal_pos )] = line.substr( equal_pos + 1, line.length );
	}
} );
var env = function ( key, def ) {
	if ( typeof def === 'undefined' ) {
		def = null;
	}
	if ( typeof env_array[key] === 'undefined' ) {
		return def;
	}
	return env_array[key];
};

var app = require( 'express' )();
var http = null;
var server = null;
if(env( 'NODE_SOCKET_PROTOCOL' ) == 'https'){
	http = require('https');
	options = {
		key: fs.readFileSync('opensslkeys/key.pem'),
		cert: fs.readFileSync('opensslkeys/cert.pem')
	};
	server = http.createServer(options, app).listen( env( 'NODE_SOCKET_PORT' ), env( 'NODE_SOCKET_HOST' ), function () {
		console.log( 'Server running at ' + env( 'NODE_SOCKET_PROTOCOL' ) + '://' + env( 'NODE_SOCKET_HOST' ) + ':' + env( 'NODE_SOCKET_PORT' ) );
	} );
} else {
	http = require( 'http' );
	options = {};
	server = http.Server(app).listen( env( 'NODE_SOCKET_PORT' ), env( 'NODE_SOCKET_HOST' ), function () {
		console.log( 'Server running at ' + env( 'NODE_SOCKET_PROTOCOL' ) + '://' + env( 'NODE_SOCKET_HOST' ) + ':' + env( 'NODE_SOCKET_PORT' ) );
	} );
}

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, PATCH, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    next();
});

app.get( '/', function ( req, res ) {
	res.send( '<h1>Hello world</h1>' );
} );

var io = require( 'socket.io' ).listen(server);

io.online_user_counter = { };

setInterval( function () {
	var io_online_user_counter = { };
	Object.keys( io.online_user_counter ).forEach( function ( key ) {
		if ( io.online_user_counter[key] > 0 ) {
			io_online_user_counter[key] = io.online_user_counter[key];
		}
	} );
	io.online_user_counter = io_online_user_counter;
	//console.log( JSON.stringify( io.online_user_counter ) );
}, 1000 * 60 * 60 );

io.on( 'connection', function ( socket ) {
	//console.log( 'User connected:', socket.id );

	socket.on( 'disconnect', function () {
		//console.log( 'User disconnected:', socket.id );
		if ( typeof io.online_user_counter[socket.user_id] !== 'undefined' ) {
			io.online_user_counter[socket.user_id]--;
			setTimeout( function () {
				if ( io.online_user_counter[socket.user_id] === 0 ) {
					socket.broadcast.emit( 'update-user-online', {
						user_id: socket.user_id,
						is_online: 'no',
						lbl_online: 'Offline',
					} );
					try {
						http.get( env( 'APP_URL' ) + '/nodejs_user_gone_offline'
								+ '?uid=' + socket.user_id
								+ '&token=' + env( 'NODE_TOKEN' )
								, function ( res ) {
									res.on( 'data', function ( data ) {
										console.log( 'nodejs_user_gone_offline: ' + data );
									} );
								} );
					} catch (ex) {
						console.log(ex);
					}
				}
			}, 1000 * 5 );
		}
		console.log( JSON.stringify( io.online_user_counter ) );
	} );

	

	socket.on( 'put-user-online', function ( data ) {
		// console.log( 'put-user-online', data );
		socket.user_id = data.user_id;
		if ( typeof io.online_user_counter[socket.user_id] === 'undefined' ) {
			io.online_user_counter[socket.user_id] = 0;
		}
		io.online_user_counter[socket.user_id]++;
		if ( io.online_user_counter[socket.user_id] === 1 ) {
			socket.broadcast.emit( 'update-user-online', {
				user_id: socket.user_id,
				is_online: 'yes',
				lbl_online: 'Online',
			} );
		}
		console.log( JSON.stringify( io.online_user_counter ) );
	} );

	socket.on( 'check-user-online', function ( data ) {
		//console.log( 'check-user-online', data );
		if ( typeof io.online_user_counter[data.user_id] === 'undefined' ) {
			io.online_user_counter[data.user_id] = 0;
		}
		var emit_data = {
			user_id: data.user_id,
			is_online: 'no',
			lbl_online: 'Offline',
		};
		if ( io.online_user_counter[data.user_id] > 0 ) {
			emit_data.is_online = 'yes';
			emit_data.lbl_online = 'Online';
		}
		socket.emit( 'update-user-online', emit_data );
	} );

	socket.on( 'room-join', function ( data ) {
		//console.log( 'room-join', data );
		socket.join( data.room );
	} );

	socket.on( 'room-leave', function ( data ) {
		//console.log( 'room-leave', data );
		socket.leave( data.room );
	} );

	socket.on( 'room-message', function ( data ) {
		//console.log( 'room-message', data );
		if ( typeof data.type === 'undefined' ) {
			data.type = '';
		}
		socket.broadcast.emit( 'room-message-received', { room: data.room, type: data.type } );
		io.to( data.room ).emit( 'room-message:' + data.room, data );
	} );

} );
