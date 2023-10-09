const socket = io()

// DOM elements that will be used frequently
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
})

const autoScroll = () => {
	// get the newest message element
	const $newMessage = $messages.lastElementChild

	// find the height of this element
	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	// visible height
	const visibleHeight = $messages.offsetHeight

	// height of messages container
	const containerHeight = $messages.scrollHeight

	// How far has user scrolled
	const scrollOffset = ($messages.scrollTop = visibleHeight)

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight
	}
}

// A message has been received
socket.on('msg', (msg) => {
	console.log(msg)
	const html = Mustache.render(messageTemplate, {
		username: msg.username,
		msg: msg.text,
		createdAt: moment(msg.createdAt).format('h:mm a'),
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

// A location message has been received
socket.on('locationMessage', (url) => {
	console.log(url)
	// const msg = `<a href="${m}">Location</a>`
	const html = Mustache.render(locationTemplate, {
		username: url.username,
		url: url.url,
		createdAt: moment(url.createdAt).format('h:mm a'),
	})
	$messages.insertAdjacentHTML('beforeend', html)
	autoScroll()
})

socket.on('roomupdate', ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		room,
		users,
	})
	document.querySelector('#sidebar').innerHTML = html
})

// Send a message to the server
$messageForm.addEventListener('submit', (e) => {
	e.preventDefault()

	// Disable button after sending message to prevent dupes
	$messageFormButton.setAttribute('disabled', 'disabled')

	const msg = e.target.elements.message.value
	socket.emit('sendMessage', msg, (m) => {
		console.log(`Message status: ${m} `)
	})

	// Disable button after sending message to prevent dupes
	$messageFormButton.removeAttribute('disabled')

	// Clear value and set focus
	$messageFormInput.value = ''
	$messageFormInput.focus()
})

// Send location to the server
$sendLocationButton.addEventListener('click', () => {
	if (!navigator.geolocation) {
		return
	}

	$sendLocationButton.setAttribute('disabled', 'disabled')
	$sendLocationButton.innerHTML = 'Sharing location'

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
			(msg) => {
				console.log(`Sharing status: ${msg}`)

				const html = Mustache.render(messageTemplate, {
					msg,
					createdAt: moment(new Date().getTime()).format('h:mm a'),
				})
				$messages.insertAdjacentHTML('beforeend', html)
			}
		)
	})
	$sendLocationButton.innerHTML = 'Location shared'
	$sendLocationButton.removeAttribute('disabled')
	$sendLocationButton.innerHTML = 'Share location again'
})

socket.emit('join', { username, room }, (error) => {
	if (error) {
		console.log(error)
		location.href = '/'
	}
})
