/**
 * @fileoverview Defines the Panel prototype
 * @version $Id: alpheios-panel.js 2277 2009-11-17 19:52:34Z BridgetAlmas $
 * 
 * Copyright 2008-2009 Cantus Foundation
 * http://alpheios.net
 * 
 * This file is part of Alpheios.
 * 
 * Alpheios is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alpheios is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
/**
 * @class Panel defines the base class for Panel objects which represent
 * a usage of the alpheiosPanel tag in the interface.  This class is intended
 * as an abstract class, and is expected to be subclassed for all uses of the 
 * alpheiospanel tag. 
 * @constructor
 * @param {alpheiosPanel} a_panel DOM object bound to the alpheiosPanel tag
 */
define(['jquery','main','logger','prefs','xlate','languages'], 
		function($,main,logger,prefs,xlate,languages) {
	function Panel(a_panel)
	{
	    this.d_panelElem = a_panel;
	    this.d_panelId = $(a_panel).attr("id");
	    this.d_parentBox = $(this.d_panelElem).parent(".alph-panel")[0];
	    this.d_sectionParent = $(this.d_panelElem).parents(".alph-panel-section");
	    this.d_notifier = $(this.d_panelElem).attr("notifier");
	    this.d_panelWindow = null;
	    this.d_currentBrowser = null;
	    
	};
	
	/**
	 * Public static class variable for panel status meaning the panel is shown.
	 * @public
	 * @type int
	 */ 
	Panel.STATUS_SHOW = 1;
	
	/**
	 * Public static class variable for panel status meaning the panel was hidden by 
	 * the user.
	 * @public
	 * @type int
	 */ 
	Panel.STATUS_HIDE = 0;
	
	/**
	 * Public static class variable for panel status meaning the panel was automatically
	 * hidden by the application.
	 * @public
	 * @type int
	 */ 
	Panel.STATUS_AUTOHIDE = 3;
	
	/**
	 * Intialization method which can be used for panel-specific initialization 
	 * code.
	 * @private
	 */
	Panel.prototype.init = function()
	{
	    // override in panel specific implementations
	};
	
	/**
	 * Resets the panel state (open/closed) to the correct default
	 * for the panel.
	 * @returns the new panel status (should be one of 
	 *              Panel.STATUS_SHOW, Panel.STATUS_HIDE 
	 *              Panel.STATUS_AUTOHIDE)
	 * @type int
	 */
	Panel.prototype.resetToDefault = function()
	{
	    // if a preference is stored, use it
	    var status_pref = this.getStatusPrefSetting();
	    
	    var lang = main.getStateObj().getVar("current_language");
	    var status;
	    // use the global prefs unless we're overriding for this language
	    if (prefs.get("panels.use.defaults",lang))
	    {
	        status = prefs.get(status_pref);
	    }
	    else
	    {
	        status = prefs.get(status_pref,lang);
	    }
	    
	    if (typeof status != "undefined" && status == Panel.STATUS_SHOW)
	    {
	        this.open();
	    }
	    else
	    {
	        // default status for all panels is hidden
	        this.updateStatus(this.hide());
	    }
	}
	
	/**
	 * Resets the state of the panel to the last state set for the 
	 * current browser (or to default if this is the first time called
	 * for the browser session).
	 * @param {Browser} a_bro browser object
	 * @returns the new panel status (should be one of 
	 *              Panel.STATUS_SHOW, Panel.STATUS_HIDE 
	 *              Panel.STATUS_AUTOHIDE)
	 * @type int
	 */
	Panel.prototype.resetState = function(a_bro)
	{
	
	    var old_browser = this.d_currentBrowser;
	    
	    // keep a reference to the current browser for the panel
	    // so that when we reset to a new state, we can access
	    // the prior browser state easily
	    this.d_currentBrowser = a_bro;
	    
	    var panel_state = this.getBrowserState(a_bro);
	    var old_state;
	    if (old_browser != null)
	    {
	        old_state = this.getBrowserState(old_browser);
	    }
	    // update the panel contents for the current browser
	    this.resetContents(panel_state,old_state);
	         
	    // just auto hide everything if alpheios is disabled
	    if ( ! main.isEnabled(a_bro))
	    {
	        this.updateStatus(this.hide(true));
	    }
	    else
	    {
	        this.resetToDefault(a_bro);
	    }
	    
	};
	
	/** 
	 * Responds to a page refresh 
	 */
	Panel.prototype.handleRefresh = function(a_bro)
	{
	    // default does nothing
	}
	
	/**
	 * Updates the interface to a new panel status and 
	 * stores the new status to the panel state object
	 * @private
	 * @param {int} a_status the new panel status (should be one of 
	 *              Panel.STATUS_SHOW, Panel.STATUS_HIDE 
	 *              Panel.STATUS_AUTOHIDE)
	 * @returns the new panel status
	 * @type int
	 */
	Panel.prototype.updateStatus = function(a_status)
	{
	 
	    var panel_obj = this;
	    var sib_splitters = 
	        $(this.d_parentBox).siblings(".alph-panel-splitter");
	    
	    var notifier = $("#" + this.d_notifier);
	    
	    // update the browser state object to reflect the new
	    // panel status
	    // NOTE - do this before changing the state of the panels
	    // so that any event handlers which need to know the new
	    // state get the correct value from the state object
	    var bro = main.getCurrentBrowser();
	    var panel_state = this.getBrowserState(bro);
	    
	    var old_status = panel_state.status;
	    
	    panel_state.status = a_status;
	
	    // uncollapse parent box and parent's sibling splitter
	    // update notifier
	    // but not if we're just detaching the panel (in which case
	    // d_panelWindow will be non null)
	    if (a_status == Panel.STATUS_SHOW && this.d_panelWindow == null)
	    {
	        $(this.d_parentBox).attr("collapsed",false);
	        
	        $(sib_splitters).each(
	            function()
	            {
	                panel_obj.toggleSplitter(this,true);
	            }
	        );
	        
	        if ($(notifier).attr("checked") != null)
	        {
	            $(notifier).attr("checked", "true");
	        }
	        // make sure any section parents and section splitters are also expanded
	        $(this.d_sectionParent).each(
	            function() {
	                $(this).attr("collapsed",false);
	                $(this)
	                    .siblings(".alph-panel-section-splitter")
	                    .each(
	                        function()
	                        {
	                            panel_obj.toggleSectionSplitter(this, true);
	                        }
	                    );
	            }
	        );
	    
	    }
	    else
	    {
	        $(this.d_parentBox).attr("collapsed",true);
	        $(sib_splitters).each(
	            function()
	            {
	                panel_obj.toggleSplitter(this,false);
	            }
	        );
	
	        
	        // collapse the containing parent panel sections only 
	        // if all the panels in it are now collapsed
	
	        $(this.d_sectionParent).each(
	            function() {
	                var still_open = 0;   
	                $(".alph-panel",this).each(
	                    function() {
	                        if (this.getAttribute("collapsed") == 'false')
	                        {
	                            still_open = still_open + 1;
	                            
	                        }
	                    }
	                ); 
	                if (still_open == 0)
	                {
	                    $(this).attr("collapsed",true);
	                    $(this)
	                        .siblings(".alph-panel-section-splitter")
	                        .each(
	                            function() 
	                            {
	                                panel_obj.toggleSectionSplitter(
	                                    this,
	                                    false
	                                );
	                            }
	                        );
	                }
	            }
	        ); 
	             
	        if (a_status == Panel.STATUS_HIDE || a_status == Panel.STATUS_AUTOHIDE)
	        {
	            // update the state of the checkbox only if we're hiding the panel
	            // rather than detaching it (in which case we have STATUS_SHOW)
	            if ($(notifier).attr("checked") != null)
	            {
	                $(notifier).attr("checked", "false");
	            }
	            // if the panel is detached, close it 
	            if (this.windowOpen())
	            {
	                try 
	                {
	                    this.d_panelWindow.close();
	                    this.d_panelWindow = null;
	                }
	                catch(a_e)
	                {
	                    logger.error("Error closing window " + a_e)
	                }
	                // TODO - need to figure out how we want to handle detached panels
	                // across multiple tabs
	            }
	        }
	        else
	        {
	            if ($(notifier).attr("checked") != null)
	            {
	                $(notifier).attr("checked", "true");
	            }
	
	        }
	    }
	    
	    // if we're responding to a user request, and panel changes
	    // are sticky, store the new status as the default status for the panel
	    if (a_status != Panel.STATUS_AUTOHIDE 
	        && prefs.get("panels.sticky")
	        )
	
	    {
	        // TODO support per url preferences ?   
	        var lang = main.getStateObj(bro).getVar("current_language");
	        if (lang != "")
	        {
	            // if we're using the defaults, store to defaults
	            // otherwise store to the language 
	            if (prefs.get("panels.use.defaults",lang))
	            {
	                prefs.set(this.getStatusPrefSetting(),a_status);
	            }
	            else
	            {
	                prefs.set(this.getStatusPrefSetting(),a_status,lang)
	                
	            }
	        }
	    }
	    
	    // TODOHTML5 - implement Site for html5
	    //Alph.Site.setToolbarPanelStatus(main.getBrowserDocs(bro),this.d_panelId,a_status);
	    
	    // if the panel status changed, call observeUIEvent to make sure the 
	    // panel contents are up to date
	    if (old_status != a_status)
	    {
	        this.observeUIEvent(bro);    
	    }
	    
	    return a_status;
	};
	
	/**
	 * Show (open) the panel.
	 * @returns {@link Panel#STATUS_SHOW} if the conditions were met
	 * to show the panel. Otherwise {@link Panel#STATUS_AUTOHIDE}
	 * @type int  
	 */
	Panel.prototype.show = function()
	{   
	    // default behavior is just to show the panel.
	    // Override to add additional checks and 
	    // panel initialization code.
	    return Panel.STATUS_SHOW;
	        
	};
	
	/**
	 * Detach the panel (in the 'SHOW' state only)
	 */
	Panel.prototype.detach = function()
	{   
	    var chrome_url = this.getDetachChrome();
	    if (chrome_url == null)
	    {
	        alert("Detach not yet supported for this panel.");
	        return;
	    }
	     
	    try {
	        this.d_panelWindow = 
	            xlate.openSecondaryWindow(
	                this.d_panelId,
	                chrome_url
	            );
	    } catch(a_e) 
	    {
	        logger.error("Error detaching panel: " + a_e);
	    }
	  
	    return this.updateStatus(Panel.STATUS_SHOW);
	};
	
	/**
	 * Restore the panel to the current inline state
	 */
	Panel.prototype.restore = function()
	{
	    // Close the window if it's not already
	    if (this.windowOpen())
	    {
	        this.d_panelWindow.close();
	        this.d_panelWindow = null;
	    }
	    
	    var panel_state = this.getBrowserState(main.getCurrentBrowser());
	    this.updateStatus(panel_state.status);
	}
	
	/**
	 * Update a browser in the detached panel window with the current 
	 * state of that browser the real (attached) panel
	 * @param {Object} a_panel_state the panel state object
	 * @param {String} a_browser_id the id of the browser to update
	 * @param {String} a_browser_index the index of the browser to update
	 */
	Panel.prototype.updatePanelWindow = 
	    function(a_panel_state,a_browser_id,a_browser_index)
	{
	    // default does nothing - override for panel-specific behavior
	}
	
	/**
	 * Hide (close) the panel.
	 * @param {Boolean} a_autoflag flag to indicate that the panel is being
	 *                  hidden by the application rather than the user. If not
	 *                  supplied, by the user is assumed.
	 * @returns {@link.Panel#AUTO_HIDE} or {@link Panel#STATUS_HIDE}
	 *         (depending upon the value of the a_autoflag param) if the 
	 *         conditions were met to show the panel. Otherwise should
	 *         return the current panel status.
	 */
	Panel.prototype.hide = function(a_autoflag)
	{
	    // default behavior is just to remove the panel
	    // Override to add additional checks and
	    // panel cleanup code.
	    // a_autoflag can be used to distinguish between
	    // when the user hides the panel vs. when the app does
	    if (this.d_panelWindow != null)
	    {
	        var closed = true;
	        try {
	            closed = this.d_panelWindow.closed;
	        } catch(a_e){ // in FF 3.5 the closed property isn't available for a closed chrome window
	        }
	        if (closed)
	        {
	            this.d_panelWindow = null;
	        }
	    }
	    if (a_autoflag != null && a_autoflag)
	    {
	        return Panel.STATUS_AUTOHIDE;
	    }
	    else 
	    {
	        return Panel.STATUS_HIDE;    
	    }
	    
	};
	
	/**
	 * Open the panel or panel window
	 * @returns the new panel status
	 * @type int
	 */
	Panel.prototype.open = function()
	{    
	    if (prefs.get('panels.inline.'+this.d_panelId)
	        || (this.windowOpen()))
	    {
	        return this.updateStatus(this.show());
	    }
	    else
	    {
	        // the handlers for the detached window
	        // will call show() to update the panel status 
	        return this.detach();
	    }
	}
	
	/**
	 * Toggle the state of the panel (hide if shown, and vice-versa)
	 * @returns the new panel status
	 * @type int
	 */
	Panel.prototype.toggle = function()
	{
	    var bro = main.getCurrentBrowser();
	    var panel_state = this.getBrowserState(bro);
	    
	    if (panel_state.status == Panel.STATUS_SHOW)
	    {
	        return this.updateStatus(this.hide());
	    }
	    else
	    {
	        return this.open();
	    }
	};
	
	/**
	 * Method which can be used as a deconstructor for the panel.
	 */
	Panel.prototype.cleanup = function()
	{
	    // TODO - remove all references to this panel in any
	    // of the tab browsers
	};
	
	/**
	 * Method which can be used to reset the contents for the panel
	 * when the panel state changes 
	 * @param {Object} a_panel_state the current panel state object
	 * @param {Object} the prior state object
	 */
	Panel.prototype.resetContents = function(a_panel_state,a_old_state)
	{
	    // default does nothing  - override in panel-specific implementations
	};
	
	/**
	 * Method which can be registered to observe changes to the overall UI
	 * in the specific panel.
	 * TODO - ultimately this should be redone using an Observer service -
	 * may make sense to wait until we can use a JS module for this (with FF3)
	 * @param {Browser} a_bro the current browser
	 * @param a_event_type the event type (one of @link Alph.Constants.events)
	 * @param a_event_data optional event data object
	 */
	Panel.prototype.observeUIEvent = function(a_bro,a_event_type,a_event_data)
	{
	    // default does nothing - override in panel-specific implementations
	};
	
	/**
	 * Get the panel state for the current browser object
	 * @param {Browser} a_bro the current browser
	 * @returns the panel state object
	 * @type Object
	 */
	Panel.prototype.getBrowserState = function(a_bro)
	{
	  var panel_state = main.getStateObj(a_bro).getVar("panels");
	  if (typeof panel_state[this.d_panelId] == "undefined")
	  {
	    panel_state[this.d_panelId] = {};
	    // initialize the panel state
	    this.init(panel_state[this.d_panelId]);
	  }
	  return panel_state[this.d_panelId];
	};
	
	/**
	 * Get the name of the preferences setting for the panel status
	 */
	Panel.prototype.getStatusPrefSetting = function()
	{
	    var status_pref = "panels." + this.d_panelId + ".";
	    // Pedagogical Site preferences are separate from Basic preferences
	    // TODO - eventually we may want to support per-url preferences for all sites
	    if ($("#alpheios-pedagogical-status").attr("disabled") == "true")
	    {   
	        status_pref = status_pref + "basic";
	    }
	    else
	    {
	        status_pref = status_pref + "pedagogical";
	    }
	    return status_pref; 
	};
	
	/**
	 * Get the chrome url for the detached version of the panel
	 * @returns chrome url string
	 * @type String
	 */
	Panel.prototype.getDetachChrome = function()
	{
	    // default returns null
	    return null;   
	};
	
	/**
	 * toggle the collapsed attribute of a panel splitter, taking into 
	 * account the status of the surrounding panels, if any
	 * @param {XULElement} a_splitter the splitter to be toggled
	 * @param {boolean} a_open_panel flag to indicate whether the toggling
	 *                     is the result of opening (true) or closing (false)
	 *                     a panel  
	 */
	Panel.prototype.toggleSplitter = function(a_splitter,a_open_panel)
	{
	
	    var prev_panels = $(a_splitter).prev(".alph-panel");
	    var post_panels = $(a_splitter).next(".alph-panel");
	    var open_surrounding_panels = false;
	    if ((prev_panels.length > 0 
	            && $(prev_panels[0]).attr("collapsed") == "false")
	         &&
	          (post_panels.length > 0 
	            && $(post_panels[0]).attr("collapsed") == "false")
	         )
	    {
	        open_surrounding_panels = true;
	    }
	    // if we're opening a panel, this splitter should be opened if it 
	    // has sibling panels immediately before and after it 
	    // which are not collapsed
	    if (a_open_panel && open_surrounding_panels)
	    {
	        $(a_splitter).attr("collapsed",false);
	    }
	    // if we're closing a panel, this splitter should be collapsed 
	    // unless it has sibling panels immediately before and after it 
	    // which are not collapsed
	    else if (! a_open_panel && ! open_surrounding_panels)
	    {
	           $(a_splitter).attr("collapsed",true);
	    }
	};
	
	/**
	 * toggle the collapsed attribute of a panel section splitter, taking into 
	 * account the status of the surrounding panel sections, if any. Conditions
	 * are different for panel sections vs panels, hence the separate method.
	 * @param {XULElement} a_splitter the splitter to be toggled
	 * @param {boolean} a_open_panel flag to indicate whether the toggling
	 *                     is the result of opening (true) or closing (false)
	 *                     a panel  
	 */
	Panel.prototype.toggleSectionSplitter = function(a_splitter,a_open_panel)
	{
	
	    var prev_panels = $(a_splitter).prev(".alph-panel-section");
	    var post_panels = $(a_splitter).next(".alph-panel-section");
	    var open_surrounding_panels = false;
	    if ( (prev_panels.length > 0 
	            && $(prev_panels[0]).attr("collapsed") == "false")
	         &&
	          (post_panels.length > 0 
	            && $(post_panels[0]).attr("collapsed") == "false")
	         )
	    {
	        open_surrounding_panels = true;
	    }
	    // if we're opening a panel section, this splitter should be opened if it 
	    // has sibling panels immediately before and after it 
	    // which are not collapsed; OR if it doesn't have any other panel-sections
	    // before it
	    if (a_open_panel && ( open_surrounding_panels || prev_panels.length == 0))
	    {
	        $(a_splitter).attr("collapsed",false);
	    }
	    // if we're closing a panel, this splitter should be collapsed 
	    // unless it has sibling panels immediately before and after it 
	    // which are not collapsed
	    else if (! a_open_panel && ! open_surrounding_panels)
	    {
	           $(a_splitter).attr("collapsed",true);
	    }
	}
	
	/**
	 * Get the language that was used to populate the supplied 
	 * browser in the panel. Implementation is panel specific
	 * @param {Browser} a_panel_bro the panel browser we want the language for
	 * @returns the language used to populate a_panel_bro (or null if not known)
	 * @type String
	 */
	Panel.prototype.getCurrentLanguage = function(a_panel_bro)
	{
	    return null;
	}
	
	/**
	 * Check to see if the panel is currently visible and inline
	 * @param {Browser} a_bro the current browser
	 * @returns true or false
	 * @type Boolean
	 */
	Panel.prototype.isVisibleInline = function(a_bro)
	{
	    return $(this.d_parentBox).attr("collapsed") == 'false';
	};
	
	/**
	 * Get the current document shown in the panel
	 * @returns the array of content documents for the panel and panel_window
	 * @type Array{Document}
	 */
	Panel.prototype.getCurrentDoc = function(a_bro)
	{
	    var panel_obj = this;
	    var panel_state = this.getBrowserState(a_bro);
	    var docs = [];
	    $("browser",panel_obj.d_panelElem).each(
	        function()
	        {
	            docs.push(this.contentDocument);
	            if (panel_obj.windowOpen())
	            {
	                var pw_bro =
	                    panel_obj.d_panelWindow.document.getElementById(this.id);
	                if (pw_bro)
	                {
	                    docs.push(pw_bro.contentDocument);
	                }
	            }
	        }
	    );
	    return docs;
	}
	
	/**
	 * Resize the panel window to the requested dimensions
	 * @param {int} a_width requested width
	 * @parma {int} a_height requested height
	 */
	Panel.prototype.resizePanelWindow = function(a_width,a_height)
	{
	    // add a little bit to the width and height to account for title bar and leave a
	    // little room on the side
	    var width = a_width + 25; 
	    var height = a_height + 40;
	        
	    // make sure we don't resize the window to dimensions larger than the user's screen,
	    // leaving a little room around the edges
	    var max_width = this.d_panelWindow.screen.availWidth - 10;
	    var max_height = this.d_panelWindow.screen.availHeight - 10;
	    
	    if (width > max_width )
	    {
	        width = max_width;
	    }
	    if (height > max_height)
	    {
	        height = max_height;
	    }
	    this.d_panelWindow.resizeTo(width,height);
	}
	
	/**
	 * Execute a language specific command for a panel
	 * @param {Event} a_event the event which initiated the command
	 * @param {String} a_panel_id the panel id
	 */
	Panel.executeLangCommand = function(a_event,a_panel_id)
	{
	    var panel_obj;
	    if (typeof main == "undefined")
	    {
	        panel_obj = window.opener.main.d_panels[a_panel_id];
	    }   
	    else
	    {
	        panel_obj = main.d_panels[a_panel_id];    
	    }
	    
	    // if the panel is detached, need to jump through some hoops
	    // to get the correct language tool from the opener window
	    if (panel_obj.windowOpen())
	    {
	        $("browser",panel_obj.d_panelElem).each(
	            function()
	            {
	                var pw_bro =
	                    panel_obj.d_panelWindow
	                        .$("#" + a_panel_id + " browser#"+this.id)
	                        .get(0);
	                // figuring out how to get the language from the panel
	                // is panel-specific
	                var lang = panel_obj.getCurrentLanguage(pw_bro);
	                if (lang)
	                {
	                    var lang_tool = 
	                        languages.getLangTool(lang);
	                    var cmd_id = a_event.target.getAttribute("id");
	                    if (lang_tool && lang_tool.getCmd(cmd_id))
	                    {
	                        lang_tool[(lang_tool.getCmd(cmd_id))](a_event);
	                    }
	                }
	            }
	        );
	    }
	    // otherwise we can just pass it to the main.executeLangCommand function
	    // to handle
	    else
	    {
	        main.executeLangCommand(a_event);
	    }
	};
	
	/**
	 * Check to see if the detached panel window is open
	 */
	Panel.prototype.windowOpen = function()
	{
	    var open = false;
	    try 
	    {
	        open = (this.d_panelWindow != null && ! this.d_panelWindow.closed );
	    }
	    catch (a_e)
	    {
	        logger.error("Error checking panel window " + a_e);
	        // FF 3.5 throws an error checking properties on closed window objects   
	    }
	    return open;
	};

 };
});
