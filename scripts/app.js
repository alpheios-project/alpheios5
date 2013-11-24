require.config({
    baseUrl: 'scripts',
});

// Start the main app logic.
require(['jquery','main'],
function($, main) {
    //jQuery and main module are loaded and can be used here now.
	main.init();
});

