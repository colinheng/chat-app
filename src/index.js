const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicRoot = path.join(__dirname, '../public')

app.use(express.static(publicRoot))

io.on('connection', (socket) => {
	console.log('New WebSocket connection')
	socket.emit('msg', 'New connection detected. Welcome!')
	socket.broadcast.emit('msg', 'A new user has connected!')

	socket.on('sendMessage', (msg, callback) => {
		const filter = new Filter()
		if (filter.isProfane(msg)) {
			return callback('No bad words ok!')
		}
		io.emit('msg', msg)
		callback('Received by server.')
	})

	socket.on('sendLocation', (coords, callback) => {
		socket.broadcast.emit(
			'msg',
			`https://google.com/maps?q=${coords.latitude},${coords.longitude}`
		)
		callback('Location shared.')
	})

	socket.on('disconnect', () => {
		io.emit('msg', 'A user has left.')
	})
})

server.listen(port, () => {
	console.log(`Server listen on port ${port}.`)
})
