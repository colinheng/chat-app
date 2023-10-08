const socket = io()

// A message has been received
socket.on('msg', (msg) => {
	console.log(msg)
})

// Send a message to the server
document.querySelector('#message-form').addEventListener('submit', (e) => {
	e.preventDefault()
	const msg = e.target.elements.message.value
	socket.emit('sendMessage', msg, (m) => {
		console.log(`Message status: ${m} `)
	})
})

// Send location to the server
document.querySelector('#send-location').addEventListener('click', () => {
	if (!navigator.geolocation) {
		return
	}

	navigator.geolocation.getCurrentPosition((position) => {
		console.log(
			`Sharing my location: https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
		)
		socket.emit(
			'sendLocation',
			{
				latitude: position.coords.latitude,
				longitude: position.coords.longitude,
			},
			(m) => {
				console.log(`Sharing status: ${m}`)
			}
		)
	})
})
