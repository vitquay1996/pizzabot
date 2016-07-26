module.exports = {
	getIntent: function (text) {
		var intent;
		if (text.search("PIZZA") != -1) {
			intent = 'pizza'
		}
		return intent;
	}
}