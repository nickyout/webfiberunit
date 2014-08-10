module.exports = {
	"testMySuite": function(test, browser) {
		browser.url("http://www.google.com");
		var title = browser.getTitle();
		// Funny gimmick, not sure if it works globally...
		try {
			var countryString = browser.getText('[id="hplogo"] > div');
			//console.log("Google selected country:", countryString);
		} catch (err) { }
		test.ok(title.search(/google/i) !== -1, "Google still has google in its title");

	},

	"tryAgain!": function(test, browser) {
		try {
			browser.url("does.not.exist");
		} catch (err) {
			test.ok(!!err, "Erroneous url throws error!");
		}
	}
};