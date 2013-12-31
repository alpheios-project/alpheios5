define(['jquery','browser-utils','xlate','utils','lang-tool-greek','languages','state','constants','jquery.tap'], 
		function($,butils,xlate,util,LanguageTool_greek,languages,state,constants) {
	return {
        
		LanguageTool: {},
		
		init: function() {
			this.init_languages();
			// initialize the xslt for the response
	    	xlate.setXsltProcessor();
			this.enable(window,'greek');
			
		},
		
		init_languages: function() {
			if (languages.getLangList().length == 0) {
				// TODO get list of languages from ...?
				languages.addLangTool('greek',new LanguageTool_Greek('greek'));
				this.show_alpheios_loading();
			}
			return languages;
		},
		
		enable: function(a_bro,a_lang) {
			this.getStateObj(a_bro).setVar("enabled",true);	               
	        if (a_lang == null)
	        {      
	            var lang_list = Alph.Languages.getLangList();
	            if (lang_list.length > 1)
	            {            
	                var docs = this.getBrowserDocs(a_bro);
	                for (var i=0; i< docs.length; i++)
	                {                    
	                    var lang_key = util.getLanguageForDoc(docs[i]);
	                    if (lang_key){
	                        // use the first supported language we find
	                        a_lang = lang_key;
	                        break;
	                   }
	                }
	                if (! a_lang) {
	                	a_lang = lang_list[0];
	                }
	                // TODO HTML5 prompt user to select language
	                // if we still don't know the language, ask the user to choose
	                //if (! a_lang)
	                //{                  
	                //    a_lang = Alph.Main.doLangSelect();
	                //    if (! a_lang)                                        
	                //    {
	                //        // user didn't select a language, don't enable the tools                 
	                //        var err_msg = this.getString();
	                //        Alph.BrowserUtils.doAlert(
	                //            window,"alpheios-warning-dialog","alph-error-nolanguage-selected");
	                //        this.inlineDisable(a_bro);
	                //        return;
	                //    }
	                //}            
	            }
	            else
	            {
	                a_lang = lang_list[0];
	            }
	        }
	                        
	        // flag select language not to call onTabSelect
	        // because it will be called later by the calling toggle method
	        this.selectLanguage(a_lang,false);
	        
	       // TODO HTML5 User data
	      //  Alph.DataManager.handleAppEnable(window);

		},
		
		 /**
	     * Set the current language in use by the browser window.
	     * If the extension isn't already enabled, redirects to 
	     * {@link Alph.Main#alphInlineToggle} to enable it for the selected
	     * language.
	     * @private
	     * @param {String} a_lang the selected language
	     * @param {boolean} a_direct flag to indicate whether the method is being
	     *                  called directly via a menu action or from the 
	     *                  {@link Alph.Main#enable} method
	     * TODO eventually language should be automatically determined
	     * from the language of the source text if possible
	     */
	    selectLanguage: function(a_lang,a_direct) {
	        // enable alpheios if it isn't already
	        var bro = window;
	        if ( ! this.isEnabled(bro))
	        {   
	        	// TODO HTML5 inline toggle
	            //return this.alphInlineToggle(bro,a_lang);
	        }
	        // prompt the user if the language key wasn't supplied
	        if (! a_lang)
	        {
	        	// TODO HTML5 prompt for language
	            //a_lang = Alph.Main.doLangSelect();    
	        }        
	        if ((! a_lang) || (! languages.hasLang(a_lang)))
	        {
	            return;            
	        }
	        else
	        {
	            var old_lang_tool = this.getLanguageTool(bro);
	            
	            // set the new language but hold onto a copy of the old language
	            // tool for use in clearing out the browser
	            this.getStateObj(bro).setVar("current_language",a_lang);
	            
	            var lang_tool = this.getLanguageTool(bro);
	            
	            // remove the popoup and stylesheets 
	            // from the prior language, if any
	            xlate.removePopup(bro,old_lang_tool);
	            
	            // TODO HTML5 wordlist
	            // remove the wordlist observers for the prior language
	            //if (old_lang_tool)
	            //{
	            //    var wordlist = old_lang_tool.getWordList();
	            //    if (wordlist)
	            //    { 
	            //        wordlist.removeSetterObserver('\.' + old_lang_tool.getLanguage() + '$');
	            //    }
	            //}           
	            // update the popup trigger if necessary
	            this.setXlateTrigger(bro,lang_tool.getPopupTrigger());
	             
	            // if called directly, call onTabSelect to update the 
	            // menu to show which language is current; if not this
	            // should be handled by the calling method.
	            // TODO HTML5 tab select
	            if (a_direct)
	            {
	                //this.onTabSelect();
	            }
	            
	        
	        }
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
	    },
	    
	    /**
	     * Get the Alpheios state object for the selected window
	     * @param {Window} a_bro the window object
	     * @return {State} the Alpheios State object
	     */
	    getStateObj: function(a_bro)
	    {
	       return state;
	    },
	    
	    /**
	     * Resets the state element for the current window
	     */
	    resetState: function(a_window)
	    {        
	        
	    	var mainObj = this;
	        // NOTE - when a link is opened in a new tab, currentBrowser in 
	        // that case is the browser linked from ...
	    	var bro = a_window;
	        
	    	//TODO HTML5- in plugin we use Alph.Main explicitly here -- this may not
	    	// be right in all instances
	        var docs = this.getBrowserDocs(bro);
	        // TODO HTML5 Site functionality
	        var ped_site = []; 
	        //    Alph.Site.isPedSite(docs);
	        var mixed_site = false;        
	        var page_langs = null;
	        
	        var cur_lang = this.getStateObj(bro).getVar("current_language");
	        if (ped_site.length>0)
	        {     
	            page_langs = ped_site;            
	        }
	        else 
	        {
	        	// TODO HTML5 Site functionality
	            //mixed_site = Alph.Site.isMixedSite(docs)
	            if (mixed_site.length >0)
	            {
	                page_langs = mixed_site;
	            }
	            else
	            {
	            	// TODO HTML5 Site functionality
	                //page_langs=[Alph.Site.isBasicSite(Alph.BrowserUtils.getSvc('IO').newURI(bro.contentDocument.location,null,null))];
	            }   
	        }
	        var auto_lang = null;
	        for (var i=0; i<page_langs.length; i++)
	        {
	            var mapped_lang = Languages.mapLanguage(page_langs[i]);
	            if (mapped_lang && Languages.hasLang(mapped_lang)) 
	            {
	                auto_lang = mapped_lang;
	                // TODO stop at first supported language for now but ultimately
	                // need to support multiple langues, per page, and per browser frame/document
	                break;
	            }
	        }
	        if (auto_lang)
	        {
	            // if we support this language and site automatically setup the extension for it
	            // if Alpheios is not enabled, auto-enable it
	            if (! this.isEnabled(bro))
	            {
	                logger.info("Auto-enabling alpheios for " + auto_lang);
	                // TODO HTML5 Autotoggle
	                //this.autoToggle(bro,auto_lang);
	                return;
	            }
	            // if alpheios is enabled set to the right language for the prototype
	            else if (this.isEnabled(bro) && cur_lang != auto_lang)
	            {
	                logger.info("Auto-switching alpheios to " + auto_lang);
	                this.selectLanguage(auto_lang,true);
	                // selectLanguage calls onTabSelect which will re-call resetState
	                return;  
	            }
	            // if we're not on an enhanced site
	            // and make sure the mode is set to READER
	            if (ped_site.length == 0)
	            {
	                this.setMode(bro,constants.LEVELS.READER);
	            }
	            // if we're on an enhanced site,  
	            // reset the mode to whatever the default is
	            else
	            {   
	                this.setMode(bro);
	            }
	       
	        }
	        // if we're not on a supported site but were and the system automatically enabled 
	        // the extension, then disable it again
	        else if (this.isEnabled(bro) && ! this.toggledByUser(bro))
	        {
	        	// TODO HTML5 autotoglle
	            //this.autoToggle(bro);
	        }
	        if (this.isEnabled(bro))
	        {
	            // if we're on a basic site, and the extension is enabled,
	            // the set the mode to READER
	            this.setMode(bro,Constants.LEVELS.READER);
	        }
	        
	        if ((ped_site.length >0 || mixed_site.length >0) && this.isEnabled(bro))
	        {
	            // these functions should only be called after Alpheios has been auto-toggled
	            // on because otherwise they get done twice via the send call to resetState
	            // from Alph.Main.onTabSelect

	            // inject the pedagogical site with the alpheios-specific elements
	        	// TODO HTML5 Site and Query
	            //Alph.Site.setupPage(docs,
	            //   Alph.Translation.INTERLINEAR_TARGET_SRC);
	            
	            // if we're in quiz mode, and the popup is still showing for a
	            // previous selection, clear it because the alignment click handler
	            // needs to be reset
	            //if (Alph.Interactive.enabled() && Alph.Xlate.popupVisible(bro))
	            //{
	            //    Alph.Xlate.hidePopup();
	            //}
	        }
	        
	        // notify the auto-enable observers
	        $(".alpheios-auto-enable-notifier").each(
	            function()
	            {
	                if (auto_lang && mainObj.isEnabled(bro))
	                {
	                    $(this).attr("disabled",true);
	                    if ($(this).attr("hidden") != null)
	                    {
	                        $(this).attr("hidden",true);
	                    }
	                }
	                else
	                {
	                    $(this).attr("disabled",false);
	                    if ($(this).attr("hidden") != null)
	                    {
	                        $(this).attr("hidden",false);
	                    }
	                }
	            }
	            
	        );
	      
	                
	        // notify the pedagogical reader observers
	        $(".alpheios-pedagogical-notifier").each(
	            function()
	            {
	                if (ped_site.length == 0)
	                {
	                    $(this).attr("disabled",true);
	                    if ($(this).attr("hidden") != null)
	                    {
	                        $(this).attr("hidden",true);
	                    }
	                }
	                else
	                {
	                    $(this).attr("disabled",false);
	                    if ($(this).attr("hidden") != null)
	                    {
	                        Alph.$(this).attr("hidden",false);
	                    }
	                }
	            }
	            
	        );
	        
	        // notify the basic reader observers
	        Alph.$(".alpheios-basic-notifier").each(
	            function()
	            {
	                if (ped_site.length == 0)
	                {
	                    $(this).attr("disabled",false)
	                    // only set hidden if the hidden attribute was already set
	                    if ($(this).attr("hidden") != null)
	                    {
	                        $(this).attr("hidden", false);
	                    }
	                }
	                else
	                {
	                    $(this).attr("disabled",true);
	                    // only set hidden if the hidden attribute was already set
	                    if ($(this).attr("hidden") != null)
	                    {
	                        $(this).attr("hidden", true);
	                    }
	                }
	            }
	            
	        );
	        
	        
	        if (ped_site.length > 0)
	        {
	        	// TODO HTML5 Site
	            //Alph.Site.updateSiteToolStatus(docs);
	        }    
	            
	          
	        // Update the panels
	        $(".alpheiosPanel").each(
	            function()
	            {
	                var panel_id = $(this).attr("id");
	                try 
	                {
	                    var panel_obj = mainObj.d_panels[panel_id];
	                    panel_obj.resetState(bro);    
	                } 
	                catch (e)
	                {   
	                    logger.error("Unable to reset state for panel " + panel_id + ":" + e);
	                }
	            }
	        );
	        
	    },
	    
	    /**
	     * get the set of HTML documents in the current browser 
	     * @param {Browser} a_bro the current browser window
	     * @returns array of Documents (from the main browser window, as well
	     *          as any frames and iframes loaded 
	     * @type Array
	     */
	    getBrowserDocs: function(a_bro)
	    {
	        var docs = [a_bro.contentDocument];
	        $("iframe",a_bro.contentDocument).each(
	            function()
	            {
	                docs.push(this.contentDocument);
	            }
	        );
	        $("frame",a_bro.contentDocument).each(
	            function()
	            {
	                docs.push(this.contentDocument);
	            }
	        );
	        return docs;
	    },
	    
	    /**
	     * set the mode variable for the browser. 
	     * @param a_bro the subject browser
	     * @param {String} a_mode the new mode (optional - if not supplied will
	     *                        be retrieved from the document metadata
	     */
	    setMode: function(a_bro,a_mode)
	    {
	        if (typeof a_bro == "undefined" || a_bro == null)
	        {
	            a_bro = window;   
	        }
	        
	        // if we weren't explicity passed the mode, check to see
	        // if it's present in the querystring for the page
	        // TODO HTML5 use of history to manage changes in page state
	        if (typeof a_mode == "undefined")
	        {
	            //var requested_mode = a_bro.currentURI.path.match(/alpheios_mode=([^&;#]+)/);
	            //var doc_id = $("head meta[name=_alpheios-doc-id]",a_bro.contentDocument).attr("content");
	            // if the mode is specified in the query string, and we haven't
	            // already responded to the query string for this document once,
	            // then set the mode according to the query string.
	            // we don't want to do this more than once per document, because the user
	            // can change the mode after it's loaded, and we don't want to reset it 
	            // if the user switches to another tab or window after changing it.
	            //if (requested_mode && doc_id)
	            //{
	                //var uri_mode = Alph.XFRState.getStateValue(doc_id,'reqlevel');
	                //if (uri_mode == requested_mode[1])
	                //{
	                    //a_mode = requested_mode[1];
	                //}
	            //}
	            //else if (requested_mode)
	            //{
	                //Alph.XFRState.getStateValue(doc_id,'reqlevel')
	            //}
	        }
	        if (typeof a_mode != "undefined")
	        {
	            this.getStateObj(a_bro).setVar("level",a_mode);
	            
	            // update the trigger - hardcoded to dblclick for quiz mode
	            var trigger = a_mode == 
	                constants.LEVELS.LEARNER ? 'dblclick' 
	                                    : this.getLanguageTool(a_bro).getPopupTrigger();
	            this.setXlateTrigger(a_bro,trigger);
	            // clear out any popup
	            xlate.removePopup(a_bro);    

	            // close the query window
	            if (a_mode == constants.LEVELS.READER)
	            {
	            	// TODO HTML5 Query
	                //Alph.Interactive.closeQueryDisplay(a_bro);
	            }
	        }
	        var new_mode = this.getStateObj(a_bro).getVar("level");
	        
	        // TODO HTML5 Site and Translation
	        // update the site toolbar
	        //Alph.Site.setCurrentMode(Alph.Main.getBrowserDocs(a_bro),new_mode);
	        //Alph.Translation.setCurrentMode(new_mode);
	        // TODO HTML5 Toolbar UI
	        // make sure the ff toolbar button has the right state
	        //$("toolbarbutton[group=AlpheiosLevelGroup]").each(
	        //    function() { this.setAttribute("checked",'false');}
	        //);
	        $("#alpheios-level-button-"+new_mode).attr("checked",true);
	        $(".alpheios-level-disable-notifier").each(
	        	function()
	            {
	                
	                var disabled = false;
	                if (this.getAttribute("id").indexOf(new_mode) >= 0)
	                {
	                    disabled = true;
	                }
	                $(this).attr("disabled",disabled);
	                if ($(this).attr("hidden") != null)
	                {
	                    $(this).attr("hidden",disabled);
	                }
	            }
	        );
	    },
	    
	       
	    /**
	     * get the mode variable for the browser
	     * @param a_bro the subject browser
	     */
	    getMode: function(a_bro)
	    {
	     
	        if (! a_bro)
	        {
	            a_bro = window;
	        }
	        return this.getStateObj(a_bro).getVar("level");
	    },
	    
	    /**
	     * Shortcut method to see if the Alpheios extension has
	     * been enabled for the selected browser
	     * @param {Browser} a_bro the browser object
	     * @returns true if enabled false if not
	     * @type Boolean
	     */
	    isEnabled: function(a_bro)
	    {
	        return this.getStateObj(a_bro).getVar("enabled");
	    },
	    
	    /**
	     * Shortcut method to see if the Alpheios extension status
	     * for the selected browser was last toggled by an overt User action 
	     * @param {Browser} a_bro the Browser object
	     * @return true if user initiated otherwise false
	     * @type boolean 
	     */
	    toggledByUser: function(a_bro)
	    {
	        var by_user = 
	            this.getStateObj(a_bro).getVar("toggled_by") == state.USER_ACTION;
	        return by_user;
	         
	    },
	    
	    /**
	     * set the popup trigger state variable and event listener 
	     * for the browser. Can also be used to switch the browser 
	     * from one trigger to another
	     * @param a_bro the subject browser
	     * @param {String} a_trigger the trigger event name
	     * @param {Boolean} a_broadcast flag to indicate whether or not to broadcast the event
	     */
	    setXlateTrigger: function(a_bro, a_trigger,a_broadcast)
	    {
	        // broadcast the event by default if not instructed otherwise
	        if (typeof a_broadcast == "undefined")
	        {
	            a_broadcast = true;
	        }
	        // trigger is hard-coded to dble-click in quiz mode
	        if (a_trigger == 'mousemove' && this.getStateObj(a_bro).getVar("level") == constants.LEVELS.LEARNER)
	        {
	            alert(this.getString('alph-trigger-force-dbleclick'));
	            return;
	        }
	        // first, remove the old one, if any
	        var old_trigger = this.removeXlateTrigger(a_bro);
	        
	        a_bro.addEventListener(a_trigger, this.doXlateText, false);
			
	        this.getStateObj(a_bro).setVar("xlate_trigger",a_trigger);
	        // TODO HTML BROADCAST State
	        if (a_broadcast)
	        {
	            //this.setTbHints();
	        }
	        // update the trigger in any secondary windows opened by this browser
	        // TODO HTML5 Secondary window handling
	        //var windows = this.getStateObj(a_bro).getVar("windows");
	        //for (var win in windows)
	        //{
	        //    try {
	        //        if (typeof windows[win] != "undefined" 
	        //            && windows[win] != null 
	        //            && ! windows[win].closed)
	        //        {                    
	        //            var window_bro = Alph.$("browser.alpheios-trigger-proxied",windows[win].document).get(0);
	        //            if (window_bro)
	        //            {
	        //                Alph.Main.s_logger.debug("updating trigger in window " + win);
	        //                Alph.Util.removeProxiedEvent(windows[win],window_bro,old_trigger)
	        //               Alph.Util.addProxiedEvent(windows[win],window_bro,a_trigger);    
	        //                Alph.Site.addTriggerHint(a_bro,
	        //                                        window_bro.contentDocument,
	        //                                         a_trigger,Alph.Main.getLanguageTool(a_bro));
	        //            }
	        //        }
	        //    } catch(a_e)
	        //    {
	        //        Alph.Main.s_logger.error("Error updating window " + win + " : " + a_e);                           
	        //   }               
	        //}
	        if (a_broadcast)
	        {
	            this.broadcastUiEvent(constants.EVENTS.UPDATE_XLATE_TRIGGER,
	                {new_trigger: a_trigger,
	                 old_trigger: old_trigger
	                }
	            );
	        }        
	    },
	    
	    /**
	     * Get the popup trigger name for the browser
	     * @param a_bro the subject browser (if not supplied the current browser will be used)
	     * @return the trigger name
	     * @type String    
	     */
	    getXlateTrigger: function(a_bro)
	    {
	        if (! a_bro)
	        {
	            a_bro = this.getCurrentBrowser();
	        }
	        return this.getStateObj(a_bro).getVar("xlate_trigger");
	    },
	    
	    /**
	     * Remove the popup trigger event listener from the browser
	     * @private
	     * @param a_bro the subject browser  
	     * @return the old trigger
	     */
	    removeXlateTrigger: function(a_bro)
	    {
	        var trigger = this.getXlateTrigger(a_bro);
	        
	        if (trigger != null && typeof trigger != "undefined")
	        {
	            $(document).unbind(trigger,this.doXlateText,false);
	        }
	        return trigger;
	    },
	    
	    /**
	     * Handler for the popup trigger event. Hands the event off
	     * to the {@link Alph.Xlate#doMouseMoveOverText} method. 
	     * @param {Event} a_event - the browser event
	     * @return true to allow event propogation if the handler is diabled.
	     * @type Boolean
	     */
	    doXlateText: function(a_event)
	    {
	        // forward the event to Alph.Xlate.doMouseMoveOverText
	        xlate.doMouseMoveOverText(a_event);
	    },
	    
	    /** 
	     * Broadcast a UI event to the panels
	     * @param a_event_type the type of event (per Alph.Constants.events)
	     * @param a_event_data optional data object associated with the event
	     * TODO replace this with the Observes JS Module when FF3 is min supported
	     */
	    broadcastUiEvent: function(a_event,a_event_data)
	    {
	        var bro = window;
	        // Update the panels
	        $(".alpheiosPanel").each(
	            function()
	            {
	                var panel_id = $(this).attr("id");
	                try 
	                {
	                    //var panel_obj = this.d_panels[panel_id];
	                    //logger.debug("Observing ui event " + a_event + " for panel " + panel_id); 
	                    //panel_obj.observeUIEvent(bro,a_event,a_event_data);    
	                } 
	                catch (e)
	                {   
	                    logger.error("Error observing ui event for panel " + panel_id + ":" + e);
	                }
	            }
	        );
	        // Update the site
	        //Alph.Site.observeUIEvent(bro,a_event,a_event_data);
	    }
	   	   
	};
});