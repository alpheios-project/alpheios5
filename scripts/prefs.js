define(["require",'logger','module'], function(require,logger,module) {
 return {
     
	 set: function(a_name,a_value) {
		 // TODO HTML5 set preferences
		 // this[a_name] = a_value;
	 },
	 
	 get: function(a_name,a_lang) {
		 var value = null;
	     // TODO HTML5 hierarchical values
		 if (a_lang != null) {
			var main = require('main');
			var tmp = $('<div lang="' + a_lang + '"/>').get(0);
			try {
				var lt = main.getLanguageTool(tmp);
				value = lt.getPref(a_name);
			} catch (a_e) {
				logger.warn("Unable to get " + a_lang + " language tool to check preference " + a_name);
			}
		 }
		 if (value == null) {
			 value = (module.config())[a_name];
		 }
		 return value;
	 }
 };
});