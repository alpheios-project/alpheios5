/**
 * @fileoverview This file contains the Alph.Util class with the 
 * Alpheios utility functions which are not specific to the Mozilla framework
 *
 * @version $Id: alpheios-utils.js 4198 2013-01-24 00:13:23Z bmalmas $
 * 
 * Copyright 2008 Cantus Foundation
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

// initialize the namespace
//if (typeof Alph == "undefined") {
//    /**
//     * @namespace the global namespace for the Alpheios extension. All functions and objects are defined
//     *            in (or imported into)this namespace. 
//     */
//    Alph = {};
//}
/**
 * @class Alpheios utility functions
 */

define(['jquery','browser-utils','logger','languages'], 
		function($,butils,logger,languages) {

	//TODO HTML5 datafile implementation
    //Components.utils.import("resource://alpheios/alpheios-datafile.jsm",Alph);

	return {

	    ALPHEIOS_URLS:
	    {
	        main: 'http://alpheios.net',
	        help:  'http://alpheios.net/content/user-guide',
	        install: 'http://alpheios.net/content/installation',
	        support: 'mailto:support@alpheios.net',
	        content: 'http://alpheios.net/content/',
	    },
	    XUL_NS: 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul',
	        
	    makeXUL: function(a_tag,a_id,a_keys,a_values)
	    {
	        var xul = document.createElementNS(this.XUL_NS,a_tag);
	        xul.setAttribute('id',a_id);
	        a_keys.forEach(
	            function(a_key,a_i)
	            {
	                xul.setAttribute(a_key,a_values[a_i]);        
	            }
	        );
	        return xul;
	    },
	    
	    makePref: function(a_id,a_name,a_type)
	    {
	        return this.makeXUL(
	            'preference',a_id,['name','type'],[a_name,a_type]);  
	    },
	    
	    
	    /**
	     * Open a link to the alpheios site
	     * @param {Window} a_window the parent window from which to launch the link
	     * @param {String} a_loc site location
	     */
	    openAlpheiosLink: function(a_window,a_loc)
	    {
	        var url = this.ALPHEIOS_URLS[a_loc];
	        // if we don't have a specific location defined,
	        // then default to adding the location to the 
	        // main content url
	        if (typeof url != 'string')
	        {
	            url = this.ALPHEIOS_URLS.content + a_loc; 
	        }
	        butils.openNewTab(a_window,url);
	    },
	    
	    /**
	     * launch the user's email application and prepare feedback email headers
	     */
	    sendFeedback: function()
	    {
	        butils.sendFeedback(window,this.ALPHEIOS_URLS.support);
	    },
	    
	    /**
	     * Scroll a document so that supplied element is visible
	     * if the element is above the fold, the document will scroll just until
	     * it is in view at the top, and if the element is below the fold,
	     * the document will scroll just until it is in view at the bottom
	     * @param {Element} a_el the element which should be in view
	     */
	    scrollToElement: function(a_el)
	    {
	        var top = a_el.offsetTop;
	        var left = a_el.offsetLeft;
	        var width = a_el.offsetWidth;
	        var height = a_el.offsetHeight;
	
	        while(a_el.offsetParent) {
	            a_el = a_el.offsetParent;
	            top += a_el.offsetTop;
	            left += a_el.offsetLeft;
	        }
	
	        var move_x = 0;
	        var move_y = 0;
	        if (left < a_el.ownerDocument.defaultView.pageXOffset)
	        {
	            move_x = left - a_el.ownerDocument.defaultView.pageXOffset;
	        }
	        else if ((left + width) > 
	                 (a_el.ownerDocument.defaultView.pageXOffset + 
	                  a_el.ownerDocument.defaultView.innerWidth)
	                )
	        {
	            move_x = (left + width) - 
	                 (a_el.ownerDocument.defaultView.pageXOffset + 
	                  a_el.ownerDocument.defaultView.innerWidth);
	        }
	        
	        if (top < a_el.ownerDocument.defaultView.pageYOffset)
	        {
	            move_y = top - a_el.ownerDocument.defaultView.pageYOffset;
	        } 
	        else if ( (top >= a_el.ownerDocument.defaultView.pageYOffset) &&
	                  ((top + height) > 
	                   (a_el.ownerDocument.defaultView.pageYOffset +
	                    a_el.ownerDocument.defaultView.innerHeight)
	                  )
	                )
	        {
	            move_y = 
	                (top + height) - 
	                (a_el.ownerDocument.defaultView.pageYOffset +
	                 a_el.ownerDocument.defaultView.innerHeight);
	        }
	        if (move_x != 0 || move_y != 0)
	        {
	            a_el.ownerDocument.defaultView.scrollBy(move_x,move_y);
	        }
	    },
	    
	    /** 
	     * check to see if the supplied element is in view
	     * @param {Element} a_el the element
	     * @returns true if in view, otherwise false
	     * @type Boolean
	     */
	    inViewPort: function(a_el) {
	        var top = a_el.offsetTop;
	        var left = a_el.offsetLeft;
	        var width = a_el.offsetWidth;
	        var height = a_el.offsetHeight;
	
	        while(a_el.offsetParent) {
	            a_el = a_el.offsetParent;
	            top += a_el.offsetTop;
	            left += a_el.offsetLeft;
	        }
	
	        return (
	            top >= a_el.ownerDocument.defaultView.pageYOffset &&
	            left >= a_el.ownerDocument.defaultView.pageXOffset &&
	            (top + height) <= (a_el.ownerDocument.defaultView.pageYOffset + 
	                a_el.ownerDocument.defaultView.innerHeight) &&
	            (left + width) <= (a_el.ownerDocument.defaultView.pageXOffset + 
	                a_el.ownerDocument.defaultView.innerWidth)
	        );
	    },
	    
	    /**
	     * check to see if the supplied element is 'below the fold'
	     * of the viewport 
	     * @param {Element} a_el the element
	     * @returns the # of pixels out of view
	     * @type Boolean
	     */
	    belowTheFold: function(a_el) {
	        var top = a_el.offsetTop;
	        var height = a_el.offsetHeight;
	
	        while(a_el.offsetParent) {
	            a_el = a_el.offsetParent;
	            top += a_el.offsetTop;
	        }
	
	        return(
	            (top + height) - (a_el.ownerDocument.defaultView.pageYOffset + 
	                a_el.ownerDocument.defaultView.innerHeight));
	    },
	    
	    /**
	     * check to see if the supplied element is 'right of screen'
	     * of the viewport 
	     * @param {Element} a_el the element
	     * @returns the # of pixels out of view
	     * @type int
	     */
	    rightOfScreen: function(a_el) {
	        var left = a_el.offsetLeft;
	        var width = a_el.offsetWidth;
	
	        while(a_el.offsetParent) {
	            a_el = a_el.offsetParent;
	            left += a_el.offsetLeft;
	        }
	
	        return(
	            (left + width) - (a_el.ownerDocument.defaultView.pageXOffset + 
	                a_el.ownerDocument.defaultView.innerWidth));
	    },
	    
	    /**
	     * Check to see if a url is a local url
	     * @param {String} a_url the url string
	     * @returns true if its a localhost or chrome url otherwise false
	     * @type Boolean
	     */
	    isLocalUrl: function(a_url)
	    {
	        return (
	            a_url.match(/^http:\/\/(localhost|127\.0\.0\.1)/) || 
	            butils.isBrowserUrl(a_url));
	    },
	
	    /**
	     * resize the window to the specified width and height
	     * @parma {Window} a_window the window to resize
	     * @param {int} a_width the desired width
	     * @param {int} a_height the desired height
	     */
	    resizeWindow: function(a_window,a_width,a_height)
	    {
	        // add a little bit to the width and height to account for title bar and leave a
	        // little room on the side
	        var width = a_width + 25; 
	        var height = a_height + 40;
	            
	        // make sure we don't resize the window to dimensions larger than the user's screen,
	        // leaving a little room around the edges
	        var max_width = a_window.screen.availWidth - 10;
	        var max_height = a_window.screen.availHeight - 10;
	        
	        if (width > max_width )
	        {
	            width = max_width;
	        }
	        if (height > max_height)
	        {
	            height = max_height;
	        }
	        a_window.resizeTo(width,height);
	    },
	    
	    /**
	     * Method to add an event to a browser in a secondary window which can be called from either the window
	     * itself or the parent opener window.  
	     * The event will be proxied by the generic Alph.Util.proxyEventHandler method
	     * which first selects the browser which opened the window before issuing the event
	     * Requires that the window has the Alph.Util namespace loaded.
	     * @see Alph.Util.removeProxiedEvent
	     * @see Alph.Util.proxyEventHandler
	     * @param {Window} a_window the window
	     * @param {Browser} a_bro the browser to which the event is to be added
	     * @param {String} a_event the event name  
	     */
	    addProxiedEvent: function(a_window,a_bro,a_event)
	    {
	        a_bro.addEventListener(a_event, this.proxyEventHandler, false);
	    },
	
	    /**
	     * Method to remove a proxied event from a browser in a secondary window which can be called from either
	     * the window itself or the parent opener window.  
	     * Requires that the window has the Alph.Util namespace loaded
	     * @see Alph.Util.addProxiedEvent
	     * @see Alph.Util.proxyEventHandler
	     * @param {Window} a_window the window
	     * @param {Browser} a_bro the browser to which the event is to be added
	     * @param {String} a_event the event name  
	     */
	
	    removeProxiedEvent: function(a_window,a_bro,a_event)
	    {
	        a_bro.removeEventListener(a_event, a_window.this.proxyEventHandler, false);
	    },
	    
	    /**
	     * Proxy event handler for a secondary window. 
	     * Can used to handle events which may needed to be added or removed from the window
	     * by both the window itself and by the parent opener window, and which rely on the browser tab
	     * which opened the tab being current in the parent opener window before being executed.
	     * Requires that the secondary window arguments contain an object which has the following properties:
	     *     {Document} e_srcDoc: the document which initiated the opening of the secondary window
	     *     e_proxiedHandler: event handling function to be executed 
	     * @param {Event} a_event the event being handled 
	     */
	    proxyEventHandler: function(a_event)
	    {        
	        var params = typeof window.arguments != "undefined" ? 
	                        window.arguments[0] : {};
	        if (params.e_srcDoc  &&
	            params.e_proxiedHandler &&
	            // TODO HTML5 browser feature
	            //Alph.BrowserUtils.selectBrowserForDoc(window.opener,params.e_srcDoc)
	            false)
	        {            
	            params.e_proxiedHandler(a_event);
	        }
	        else
	        {
	            logger.debug("Unable to handle proxied event " + a_event);
	        }                
	    },
	    
	    /**
	     * Autodetect the language for a document
	     * @param {Document} a_doc the document
	     * @return the language key into the Alph.Languages object for the document's language
	     *         or null if the language either isn't found or isn't supported
	     * @type String
	     */
	    getLanguageForDoc: function(a_doc)
	    {
	        var lang_key = null;
	        var doc_lang = 
	            a_doc.documentElement.getAttribute("xml:lang") ||
	            a_doc.documentElement.getAttribute("lang") ||
	            $("body",a_doc).attr("xml:lang") ||
	            $("body",a_doc).attr("lang");
	        if(doc_lang)
	        {
	            doc_lang = languages.mapLanguage(doc_lang);
	        }
	        if (doc_lang && languages.hasLang(doc_lang))
	        {
	            lang_key = doc_lang;                    
	        }
	        return lang_key;
	    },
	        
	    /**
	     * Autodetect the language for an element
	     * @param {Element} a_elem the document
	     * @return the language key into the Alph.Languages object for the document's language
	     *         or null if the language either isn't found or isn't supported
	     * @type String
	     */
	    getLanguageForElement: function(a_elem)
	    {
	        var lang_key = null;
	        var elem_lang = null;
	        var checkSet = $(a_elem).add($(a_elem).parents());
	        // iterate through the set of the element and its parents
	        // taking the value of the first lang or xml:lang attribute found
	        // order of parents added in checkSet is closest-first
	        for (var i=0; i<checkSet.length; i++)
	        {    
	            var elem = checkSet.eq(i)
	            elem_lang = elem.attr("lang") || elem.attr("xml:lang");
	            if (elem_lang)
	            {
	                break;
	            }
	        }                       
	        if(elem_lang)
	        {
	            elem_lang = languages.mapLanguage(elem_lang);
	        }
	        if (elem_lang && languages.hasLang(elem_lang))
	        {
	            lang_key = elem_lang;                    
	        }
	        return lang_key;
	    }
	    
	};
});
