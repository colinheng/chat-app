const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { genMsg, genLocMsg } = require('./utils/messages')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicRoot = path.join(__dirname, '../public')

app.use(express.static(publicRoot))

io.on('connection', (socket) => {
	// A new client has connected
	console.log('New WebSocket connection')
	socket.emit('msg', genMsg('New connection detected. Welcome!'))
	socket.broadcast.emit('msg', genMsg('A new user has connected!'))

	// A new message has been received from a client
	socket.on('sendMessage', (msg, callback) => {
		const filter = new Filter()
		if (filter.isProfane(msg)) {
			return callback('No bad words ok!')
		}
		io.emit('msg', genMsg(msg))
		callback('Received by server.')
	})

	// A location has been shared by a client
	socket.on('sendLocation', (coords, callback) => {
		socket.broadcast.emit(
			'locationMessage',
			genLocMsg(
				`https://google.com/maps?q=${coords.latitude},${coords.longitude}`
			)
		)
		callback('Location shared.')
	})

	// A client has disconnected
	socket.on('disconnect', () => {
		io.emit('msg', genMsg('A user has left.'))
	})
})

server.listen(port, () => {
	console.log(`Server listen on port ${port}.`)
})
