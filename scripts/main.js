define(['jquery','browser-utils','xlate','utils','lang-tool-greek','languages'], 
		function($,butils,xlate,util,LanguageTool_greek,languages) {
	return {
        
		LanguageTool: {},
		
		init: function() {
			this.init_languages();
			this.enable();
		},
		
		init_languages: function() {
			if (languages.getLangList().length == 0) {
				languages.addLangTool('greek',new LanguageTool_Greek('greek'));
			}
			return languages;
		},
		
		enable: function() {
			$(document).bind("dblclick", xlate.doMouseMoveOverText);
		},
	    /**
	     * Get the Alph.LanguageTool instance for the current language.
	     * @param {Browser} a_bro the browser from which to retrieve the language tool
	     *                        (if not supplied, the current browser is used)
	     * @param {Element} a_elem the target element 
	     *                         (optional, if not supplied, the language for the
	     *                         document is assumed)                         
	     * @return the Alph.LanguageTool instance for the current language
	     *         or undefined if the language isn't set or the extension 
	     *         isn't enabled
	     * @type Alph.LanguageTool
	     */
	    getLanguageTool: function(a_elem)
	    {
	    	var lang_key;  
	    	var lang_tool;
	        // if we have a specific element, try to get the language
	        // tool for the element
	        if (a_elem)
	        {
	        	lang_key = util.getLanguageForElement(a_elem,languages);               
	        }
	        // fallback to the language for the browser
	        if (!lang_key)
	        {
	        	// TODO HTML5 State
	            //lang_key = this.getStateObj(a_bro).getVar("current_language");
	            lang_key = 'greek';
	        }
	        if (lang_key)
	        {
	        	lang_tool = languages.getLangTool(lang_key);
	        }
	        return lang_tool;
	    }
	};
});