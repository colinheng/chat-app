const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { genMsg, genLocMsg } = require('./utils/messages')
const {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
} = require('./utils/users')

const adminName = 'CHAT!'
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicRoot = path.join(__dirname, '../public')

app.use(express.static(publicRoot))

io.on('connection', (socket) => {
	// A new client has connected
	console.log('New WebSocket connection')

	// A join request has been received
	socket.on('join', (options, callback) => {
		const { error, user } = addUser({
			id: socket.id,
			...options,
		})
		if (error) {
			return callback(error)
		}

		socket.join(user.room)

		socket.emit(
			'msg',
			genMsg(adminName, `New connection detected. Welcome to ${user.room}!`)
		)
		socket.broadcast
			.to(user.room)
			.emit('msg', genMsg(adminName, `${user.username} has joined.`))

		io.to(user.room).emit('roomupdate', {
			room: user.room,
			users: getUsersInRoom(user.room),
		})

		callback()
	})

	// A new message has been received from a client
	socket.on('sendMessage', (msg, callback) => {
		const user = getUser(socket.id)
		const filter = new Filter()
		if (filter.isProfane(msg)) {
			return callback(`Hey ${user.username}, no bad words ok!`)
		}
		io.to(user.room).emit('msg', genMsg(user.username, msg))
		callback('Received by server.')
	})

	// A location has been shared by a client
	socket.on('sendLocation', (coords, callback) => {
		const user = getUser(socket.id)
		if (user) {
			socket.broadcast
				.to(user.room)
				.emit(
					'locationMessage',
					genLocMsg(
						user.username,
						`https://google.com/maps?q=${coords.latitude},${coords.longitude}`
					)
				)
			callback('Location shared.')
		}
	})

	// A client has disconnected
	socket.on('disconnect', () => {
		const user = removeUser(socket.id)
		if (user) {
			io.to(user.room).emit(
				'msg',
				genMsg(adminName, `${user.username} has left.`)
			)
			io.to(user.room).emit('roomupdate', {
				room: user.room,
				users: getUsersInRoom(user.room),
			})
		}
	})
})

server.listen(port, () => {
	console.log(`Server listen on port ${port}.`)
})
