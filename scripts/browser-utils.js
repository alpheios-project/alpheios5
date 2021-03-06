define(["jquery","i18n!nls/baseui",'logger','prefs','sarissa/sarissa'], function($,baseui,logger,prefs,sarissa) {
 return {
	 
	    /** 
	     * display a confirmation dialog
	     * @param {Window} a_window the parent window
	     * @param {String} a_text the text contents for the dialog
	     * @returns the result from the confirmation dialog 
	     *          (true if the user selected Ok, false if they selected Cancel)
	     */
	    doConfirm: function(a_window,a_text)
	    {
	        var title = baseui.confirm_dialog;
	        var text = baseui[a_text] || a_text;
	        var result = confirm(a_window,title,text);
	        return result;
	    },
	    
	    /** 
	     * display an alert dialog
	     * @param {Window} a_window the parent window
	     * @param {String} a_text the text contents for the dialog
	     */
	    doAlert: function(a_window,a_text)
	    {
	        var title = baseui.general_dialog_title;
	        var text = baseui[a_text] || a_text;
	        alert(a_window,title,text);
	    },
	    
	    /**
	     * get xslt processor
	     * @param {String} a_filename the name of the xslt file to import
	     * @param {String} a_lang optional language-specific indicator
	     * @returns a new XSLTProcessor object with the named stylesheet imported from the xslt directory of the extension 
	     * @type XSLTProcessor
	     */
	     getXsltProcessor: function(a_filename,a_lang, a_callback)
	    {
	        
	        try
	        {
	            var xslt_url = prefs.get('contenturl',a_lang) + '/xslt/' + a_filename;
	            $.get(xslt_url,
	            		function(a_data,a_status,a_req) {
	            			var xsltProcessor = new XSLTProcessor();
	            			xsltProcessor.importStylesheet(a_data);
	            			a_callback(xsltProcessor);
	            		},
	            		"xml");
	        }
	        catch(a_e)
	        {
	        	logger.error(a_e);
	        }
	    },
	    
	    /**
	     * Open a new tab and select it
	     * @param {Window} a_window the parent window
	     * @param {String} a_url the url to open
	     */
	    openNewTab: function(a_window,a_url)
	    {
	    	// A5 TODO for now this just uses window.open -- eventually we may
	    	// want to support different functionality esp. for mobile vs desktop?
	        a_window.open(a_url);
	    },
	    
	    /**
	     * launch the user's email application and prepare feedback email headers
	     */
	    sendFeedback: function(a_window,a_url)
	    {
	        var subject = baseui.feedback_subject;
	        var body = '\n\n' + baseui.alph_installed_versions + '\n';
	        var pkgs = this.getAlpheiosPackages();
	        pkgs.forEach(
	            function(a_pkg)
	            {
	                body = body + a_pkg.name + ': ' + a_pkg.version + '\n';
	            }
	        );
	        subject=encodeURIComponent(subject);
	        body= encodeURIComponent(body);     
	        var url = a_url + '?subject=' + subject + '&body=' + body;
	        this.loadUri(url);
	    },
	    
	    /**
	     * Check to see if a url is for a browser resource
	     * @param {String} a_url the url string
	     * @return true if its a chrome or resource url otherwise false
	     * @type Boolean
	     */
	    isBrowserUrl: function(a_url)
	    {
	        return a_url.match(/^(chrome|resource):/);
	    },
	    
	    readFile: function(a_url,a_charset,a_type,a_success,a_error,a_complete) {
	    	$.ajax(
		         {
		             type: "GET",
		             url: a_url,
		             dataType: 'text',
		             error: function(req,textStatus,errorThrown)
		             {
		                 a_error(textStatus||errorThrown);

		             },
		             success: a_success,
		             complete: a_complete
		         }
		     );
	    },
	    
	    getMostRecentWindow: function() {
	    	// A5 TODO the plugins kept track of the different state of the tools in
	    	// different browser tabs - for just always assume the current window
	    	// but we may at some point want to support more advanced state.
	    	return window;
	    }
 };
});