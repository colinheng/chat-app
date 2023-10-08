const genMsg = (text) => {
	return {
		text,
		createdAt: new Date().getTime(),
	}
}

const genLocMsg = (url) => {
	return {
		url,
		createdAt: new Date().getTime(),
	}
}

module.exports = {
	genMsg,
	genLocMsg,
}
