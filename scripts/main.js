define(['jquery','xlate'], function($,xlate) {
	return {
		init: function() {
			this.enable();
		},
		enable: function() {
			alert("Enable");
			$(document).bind("dblclick", xlate.doMouseMoveOverText)
		}
	};
});