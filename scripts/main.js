define(['jquery','browser-utils','xlate','utils','lang-tool-greek','languages'], 
		function($,butils,xlate,util,LanguageTool_greek,languages) {
	return {
        
		LanguageTool: {},
		
		init: function() {
			this.init_languages();
			// initialize the xslt for the response
	    	xlate.setXsltProcessor();
			this.enable();
			
		},
		
		init_languages: function() {
			if (languages.getLangList().length == 0) {
				// TODO get list of languages from ...?
				languages.addLangTool('greek',new LanguageTool_Greek('greek'));
				this.show_alpheios_loading();
			}
			return languages;
		},
		
		enable: function() {
			$(document).bind("dblclick", xlate.doMouseMoveOverText);
			$(document).bind("tap", xlate.doMouseMoveOverText);
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
	    },
	    
	    show_alpheios_loading: function() {
	    	var mainObj = this;
	    	if ($("#alpheios-loading").get(0)) {
	    		$("#alpheios-loading").show();
	    		return;
	    	}
	    	var loading_div = 
	    		'<div id="alpheios-loading" ' + 
	    		'style="position: absolute; top: 10px; left: 10px; background: white url(http://alpheios.net/bookmarklet/stylesheets/icons/alpheios_16.png) no-repeat;' + 
	    		' border-color: #3E8D9C #B8B7B5 #B8B7B5 #73CDDE !important; border-style: outset !important; border-width: 2px !important;' +
	    		' width: 100px; min-height: 50px;'
	    		+'">' +
	    		'<div id="alpheios-loading-inner" style="padding-left: 24px; background: 0px 24px transparent url(http://alpheios.net/bookmarklet/stylesheets/loading.gif) no-repeat;">' +
	    		'Loading Alpheios Resources...' +
	    		'</div></div>'
			$("body").prepend(loading_div);
	    	$("#alpheios-loading").on("ALPHEIOS_LOAD_COMPLETE",
	    			function(a_event,a_lang){
	    				$(this).append("<div>" + a_lang + " loaded!</div>");
	    				var stillLoading = false;
	    				var langList = languages.getLangList();
	    				for (var i=0; i<langList.length; i++) {
	    					var lt = languages.getLangTool(langList[i]);
	    					if (lt.is_loading()) {
	    						stillLoading = true;
	    					}
	    				}
	    				if (! stillLoading) {
	    					$("#alpheios-loading").hide();
	    				}
	    			})
	    }

	};
});