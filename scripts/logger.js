define([], function() {
 return {
	 
	 has_console : !(window.console == 'undefined'),
	 ERROR : 1,
	 WARN : 2,
	 INFO : 3,
	 DEBUG : 4,
	 log_level : 4,
	 
	 debug: function(a_msg) {
		 if (this.has_console && this.log_level >= this.DEBUG) { 
		 	console.debug(a_msg);
		 }
	 },

	 warn: function(a_msg) {
		 if (this.has_console && this.log_level >= this.WARN) { 
		 	console.warn(a_msg);
		 }
	 },
	 
	 error: function(a_msg) {
		 if (this.has_console && this.log_level >= this.ERROR) { 
		 	console.error(a_msg);
		 }
	 },
	 
	 info: function(a_msg) {
		 if (this.has_console && this.log_level >= this.INFO) { 
		 	console.info(a_msg);
		 }
	 }
 }
});