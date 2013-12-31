/**
 * @fileoverview This file contains the Alph.Xlate class with generic
 * Mouseover translation functions
 *
 * @version $Id: alpheios-popup.js 4198 2013-01-24 00:13:23Z bmalmas $
 *
 * Copyright 2008-2009 Cantus Foundation
 * http://alpheios.net
 *
 * Based upon PeraPera-Kun
 * A modded version of Rikai-Chan by Justin Kovalchuk
 * Original Author: Jonathan Zarate
 * Copyright (C) 2005-2006
 * http://www.polarcloud.com/
 *
 * Based on rikaiXUL 0.4 by Todd Rudick
 * http://rikaixul.mozdev.org/
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
 * @class Alph.Xlate contains the generic popup functionality
 */
define(['require','jquery','logger','prefs','browser-utils','i18n!nls/baseui','utils'], function(require,$,logger,prefs,butils,baseui,utils) {
	var xlate = {

        setXsltProcessor: function(a_proc) {
        	var xlateObj = this;
        	if (this.d_xsltProcessor == null) {
        		butils.getXsltProcessor('alpheios.xsl',null,
        				function(a_proc) { 
        					xlateObj.d_xsltProcessor = a_proc;
        				});
        	}
        },
	    /**
	     * Handler for the popup trigger event.
	     * @param {Event} a_e the Event
	     */
	    doMouseMoveOverText: function(a_e)
	    {
	        if (!a_e)
	            a_e = window.event;
	
	        var rp;
	        var ro;
	        
	        if (a_e.rangeOffset) {
	        	rp = a_e.rangeParent;
	        	ro = a_e.rangeOffset;

	        // webkit doesn't support Event.rangeParent    
	        } else if (document.caretRangeFromPoint) {
	        	var range = document.caretRangeFromPoint(a_e.clientX, a_e.clientY);
	        	rp = range.startContainer;
	        	ro = range.startOffset;
            	
	    	}
	        
	        // Check to see if the user has selected text from within an SVG diagram
	        var is_svg_text = (
	            rp instanceof SVGElement &&
	            rp.tagName == 'text' &&
	            rp.firstChild &&
	            rp.firstChild.nodeType == 3
	        );
	        // disable the popup in the translation panel in quiz mode
	        //if (Alph.Interactive.enabled() && Alph.Translation.getBrowser(rp.ownerDocument))
	        //{
	        //    return;
	        //}
	        
	        // if no data, nothing to do
	        if (typeof rp == "undefined" || rp == null ||
	            (! rp.data && ! is_svg_text))
	        {
	            console.debug("No data found");
	            return;
	        }
	        /*
	         * This is code originates from peraperakun. It checks to make sure the target
	         * of the event is either an SVG text node, a regular text node (nodeType of 3)
	         * or an element in a form.
	         * This prevents the popup from displaying when the mouse moves over whitespace
	         * in the enclosing element.
	         * The explicitOriginalTarget property of the event is a mozilla-specific
	         * property which provides access to the precise node that received the event.
	         * By contrast, in Mozilla the target property always points to the containing
	         * element object whose nodeType will always be 1.
	         * See O'Reilly's Dynamic HTML 3rd Edition and also
	         * http://developer.mozilla.org/en/docs/DOM:event.explicitOriginalTarget
	         * and https://bugzilla.mozilla.org/show_bug.cgi?id=185889
	         * However, this does not seem to work the same for the dbleclick event
	         * so this should be limited to use of the mousemove trigger.
	         */
	        //if ( main.getXlateTrigger() == 'mousemove' &&
	        //     ! is_svg_text &&
	        //    (a_e.explicitOriginalTarget.nodeType != 3) &&
	        //     !("form" in a_e.target))
	        //{
	        //    this.clearSelection();
	        //    return;
	        //}
	        
	        // check to see if the site has defined an override to our word
	        // selection algorithm based upon element class names (See Bug 377)
	        //var wordClasses = Alph.Site.getWordClasses(rp.ownerDocument);
	        var wordClassOverride = false;
	        var wordClasses = [];
	        for (var i=0; i<wordClasses.length; i++)
	        {
	            var wordClass = wordClasses[i];
	            if (wordClass && ! $(rp).hasClass(wordClass))
	            {
	                var parent = $(rp).parents("."+wordClass).get(0);
	                if (parent)
	                {
	                    rp = parent;
	                    ro = 0;
	                    wordClassOverride = true;
	                    break;
	                }                
	                                
	            }
	        }

	        // disable the translate function if and the mouse is over an
	        // element in a section of the page we've been told to ignore
	        // (e.g. web site interface text as opposed to source text)
	        if ( $(a_e.explicitOriginalTarget).hasClass('alpheios-ignore') ||
	             $(a_e.explicitOriginalTarget).parents('.alpheios-ignore').length > 0)
	        {
	            xlate.clearSelection();
	            return;
	        }
	        
	        // in a mixed site, ignore everything except explicity enabled text
	        //if (Alph.Site.isMixedSite([rp.ownerDocument]).length > 0 && 
	        //    (! $(a_e.explicitOriginalTarget).hasClass('alpheios-enabled-text')) &&
	        //      $(a_e.explicitOriginalTarget).parents('.alpheios-enabled-text').length == 0)
	        //{
	        //    this.clearSelection();
	        //    return;
	        //}

	        /* The rangeParent is going to be a #text node.
	         * Get the parentNode of the text node for use in traversing
	         * for the context if the node contains only a single word.
	         */
	        var rp_parent = rp.parentNode;

	        var range = document.createRange();
	        range.selectNode(rp);
	        var rngstr;
	        // when the selected element is an svg text element, retrieve the text from
	        // the child textNode directly rather than from the range parent.
	        // But when the trigger is dbleclick, the range parent text node is empty
	        // so the text must be retrieved from the explicitOriginalTarget instead.
	        if (is_svg_text)
	        {
	            rngstr = rp.firstChild.nodeValue ||
	                (a_e.explicitOriginalTarget.firstChild ?
	                    a_e.explicitOriginalTarget.firstChild.nodeValue : "");

	            // svg events seem to have range offset always 1 no matter where you click,
	            // which causes the whitespace test below to ignore one-character words
	            for (; ro > 0; --ro)
	            {
	                var testchar = rngstr.charCodeAt(ro - 1);
	                if (testchar == 32 ||
	                    testchar == 9 ||
	                    testchar == 10 ||
	                    testchar == 160)
	                    break;
	            }
	            // if we're on a tree diagram and the selected text element has a form attribute
	            // use that for the lookup instead of the text from the svg, which doesn't obey text
	            // direction properly (See Mozilla bug 311545 https://bugzilla.mozilla.org/show_bug.cgi?id=311545)
	            var form = $(rp).attr("form");
	            if (form)
	            {
	                console.debug("Overriding text selection from " + rngstr + " to " + form);
	                rngstr = form;
	            }
	        }
	        else
	        {
	            rngstr = range.toString();
	        }
	        /*
	         * if a site-defined word selection override was used, check to see 
	         * if we're instructed to preserve whitespace within the marked up element 
	         */
	        if (wordClassOverride && ($(rp).attr("alpheios-preserve-whitespace") != 'true'))        
	        {
	            rngstr = rngstr.replace(/\s+/g,'');
	        }

	        /* detachs the range from the parent document so that DOM no longer tracks it */
	        range.detach();

	        /* There is apparently a bug in mozilla's handling of the mouse events --
	         * if the text in the range string is preceded only by spaces or new lines
	         * then the the first non-whitepace character is never set as the rangeOffset
	         * of the event. This does not seem to affect use of the case for the &nbsp; entity
	         * or whitespace in a pre tag, so we should be safe just advancing the range offset
	         * while not affecting later tests for the mouse being in the margins
	         */
	        var testchar;
	        while ( ro < rngstr.length )
	        {
	            var testchar = rngstr.charCodeAt(ro);
	            if (testchar == 32 || testchar == 9 || testchar == 10 || testchar == 160)
	            {
	                ++ro;
	                console.debug("Advancing range offset past whitespace.");
	            }
	            else
	            {
	                break;
	            }
	        }

	        // if we advanced past the end of the string without finding anything
	        // then it was empty space so just clear the selection and return
	        if (ro >= rngstr.length) {

	            xlate.clearSelection();
	            return;
	        }        
	        //var browser = Alph.Xlate.getBrowser(rp);
	        
	        var main = require('main');
	        var alphtarget = main.getLanguageTool(a_e.explicitOriginalTarget).findSelection(ro,rngstr);

	        // if we couldn't identify the target word, return without doing anything
	        //if (! alphtarget.getWord())
	        //{
	        //    this.clearSelection();
	        //    return;
	        //}
	        
	        
	        // add the range parent object to the target
	        // so that the user's selection can be highlighted
	        // again differently after translation, if necessary
	        //alphtarget.setRangeParent(rp);

	        // nothing to do if same word as last AND the popup is shown
	        // (hidePopup removes the last word from the state variable),
	        // unless we're in query  mode and the popup isn't showing,
	        // in which case selecting the same word
	        // again should act like a reset
	        //var alph_state = main.getStateObj(browser);
	        //var lastSelection = alph_state.getVar("lastSelection");
	        //if (alphtarget.equals(lastSelection) )
	        //{
	        //    if (this.popupVisible())
	        //    {
	        //        return;
	        //    }
	        //    else if (Alph.Interactive.enabled())
	        //    {
	        //        Alph.Interactive.closeQueryDisplay(main.getCurrentBrowser());
	        //    }
	        //}

	        //alph_state.setVar("lastWord",alphtarget.getWord());
	        //alph_state.setVar("lastSelection", alphtarget);

	        // This code fails for an svg element; For now just skip it
	        // but we should eventually also highlight the selection within the svg
	        //if (! is_svg_text)
	        //{
	            // Add the range back to the document highlighted as the selected range
	         //   var doc = rp.ownerDocument;
	         //   var r = doc.createRange();
	         //   try
	         //   {
	         //       r.setStart(rp, alphtarget.getWordStart());
	         //       r.setEnd(rp, alphtarget.getWordEnd());
	         //   } catch(a_e)
	         //   {
	                // when we've overriden the range selection for the page to reference
	                // an element with children, (i.e. as for bug 377), the length of the word
	                // exceeds the boundaries of the parent node, which apparently only include
	                // the direct text of that node, and not the children nodes. 
	                // in this case, we can just select the entire parent node 
	           //     r.selectNode(rp);
	            //}
	            //var sel = doc.defaultView.getSelection();
	            //sel.removeAllRanges();
	            //sel.addRange(r);
	        //}

	        // do we have a treebank query for this word?
	        var treebank_ref = $(rp).attr("tbrefs") ||
	                           $(rp).parents().attr("tbrefs") ||
	                           $(rp).attr("tbref") ||
	                           $(rp).parents().attr("tbref");                           
	        // if we're in the dependency tree diagram, the treebank reference will
	        // be in the id attribute of the parent tree-node element
	        if (! treebank_ref && is_svg_text)
	        {
	            treebank_ref = $(rp).parents('.tree-node').attr("id");
	        }
	        if (treebank_ref)
	        {
	            alphtarget.setTreebankRef(treebank_ref);
	            var treebank_url = Alph.Site.getTreebankUrl(doc);
	            var treebank_wds = treebank_ref.split(' ');

	            // if we're in the dependency tree diagram, we will have a treebank reference
	            // but no treebank_url. get the treebank url from the main browser window
	            // in that case.
	            if (!treebank_url && is_svg_text )
	            {
//	                treebank_url =
//	                    Alph.Site.getTreebankUrl(browser.contentDocument);
	            }
	            if (treebank_url)
	            {
	                var word_param = treebank_url.match(/[\?&;]([^\|&|;|=]+)=WORD/);
	                if (word_param)
	                {
	                    word_param = word_param[1];
	                }
	                var wds = '';
	                treebank_wds.forEach(
	                    function(a_word,a_i)
	                    {
	                        if (a_i > 0)
	                        {
	                            wds = wds + '&' + word_param + '=';
	                        }
	                        wds = wds + encodeURIComponent(a_word);
	                    }
	                );
	                alphtarget.setTreebankQuery(
	                    treebank_url.replace(/WORD/,wds));
	            }
	        }
	        // show output
	        xlate.showPopup(a_e,alphtarget);
	        var lt = main.getLanguageTool(); 
	    },
	    /**
	     * Determines whether or not the popup should be displayed in response
	     * to the trigger event. Called by the {@link #doMouseMoveOverText} event handler.
	     * @private
	     * @param {Event} the event which triggered the popup
	     * @param {Object} the details on the target of the event which triggered the popup
	     *                 @see Alph.LanguageTool#findSelection
	     */
	    showPopup: function(a_e, a_alphtarget)
	    {
	
	        var a_elem = a_e.target;
	        var a_x = a_e.screenX;
	        var a_y = a_e.screenY;
	        var pageX = a_e.pageX;
	        var pageY = a_e.pageY;
	        var main = require('main');
	        //var browser = this.getBrowser(a_elem);
	        var lang_tool = main.getLanguageTool(a_elem);
	        const topdoc = a_elem.ownerDocument;
	        // TODO HTML 5 browser state
	        //var alph_state = Alph.Main.getStateObj(browser);
	        var popup = $("#alph-window").get(0);
	        // check the alpheios state object for the prior element
	        //if (alph_state.getVar("lastElem"))
	        if (false)
	        {
	        	try {
	        		popup = $("#alph-window",alph_state.getVar("lastElem").ownerDocument).get(0);
	        	} catch(e){
	                Alph.Main.s_logger.error("Error getting lastElem: " + e);
	        	}
	        	
	        }
	        // if the popup window exists, and it's in a different document than
	        // the current one, remove it from the prior document
	        // TODO HTML5 browser state
	        //if (popup && (topdoc != alph_state.getVar("lastElem").ownerDocument))
	        if (false)
	        {
	            xlate.removePopup(browser);
	            popup = null;
	        }
	
	        // popup element not found or removed, so create a new one
	        if (!popup)
	        {
	            var style_url = prefs.get("styleurl");
	            // add the base alpheios stylesheet
	            var css = topdoc.createElementNS("http://www.w3.org/1999/xhtml",
	                                             "link");
	            css.setAttribute("rel", "stylesheet");
	            css.setAttribute("type", "text/css");
	            css.setAttribute("href", style_url + "/alpheios.css");
	            css.setAttribute("class", "alpheios-css");
	            $("head",topdoc).append(css);
	            var css_os = $(css).clone()
	                .attr("href", style_url + "/alpheios-os.css");         
	            $("head",topdoc).append(css_os);
	
	            // add any language-specific stylesheet
	            lang_tool.addStyleSheet(topdoc);
	            
	            // flag the popup if we're on an enhanced text site
	            // TODO HTML5 site functionality
	            //var enhanced_class = Alph.Site.isPedSite([topdoc]).length > 0 ? ' alpheios-enhanced' : '';
	            var enhanced_class ='';
	            
	            popup = topdoc.createElementNS("http://www.w3.org/1999/xhtml", "div");
	            popup.setAttribute("id", "alph-window");
	            popup.setAttribute("class", "alpheios-ignore" + enhanced_class);
	
	            /* cancel the mousemove and dblclick events over the popup */
	            /* this probably can come out as I've switched to using the
	             * alpheios-ignore class, but leaving in commented out for now
	             */
	            //popup.addEventListener("mousemove", this.cancelMouseMove, false);
	            //popup.addEventListener("dblclick", this.cancelDoubleClick, false);
	            
	            $("body",topdoc).append(popup);
	            
	
	            // add a close link
	            $(popup).append('<div class="alph-title-bar"><div class="alph-close-button">&#160;</div></div>')
	            $(".alph-close-button",topdoc).bind("click",
	                function()
	                {
	                    xlate.hidePopup(this.ownerDocument);
	                }
	            );
	
	            $('.alph-title-bar',popup).bind('mousedown',xlate.dragPopup);
	
	            var anchor = topdoc.createElementNS("http://www.w3.org/1999/xhtml",
	                                                 "a");
	            anchor.setAttribute("name","alph-window-anchor");
	            anchor.setAttribute("id","alph-window-anchor");
	            popup.appendChild(anchor);
	        }
	
	        // add the element to the alpheios state object in the browser,
	        // so that it can be accessed to remove the popup later
	        // TODO HTML5 browser state
	        //alph_state.setVar("lastElem",a_elem);
	
	        popup.style.width = "auto";
	        popup.style.height = "auto";
	
	        var frame_offset;
	        var frame_scroll;
	
	        // get the frame offset and scroll coordines, if the selected
	        // element is in a frame
	        if (a_elem.ownerDocument.defaultView.frameElement != null)
	        {
	            try
	            {
	                frame_offset = $(a_elem.ownerDocument.defaultView.frameElement).offset();
	                frame_scroll = {};
	                var frame_body = $("body",topdoc).get(0);
	                frame_scroll.left = frame_body.scrollLeft;
	                frame_scroll.top = frame_body.scrollTop;
	            }
	            catch(e)
	            {
	                logger.error("Error getting frame coords: " + e);
	            }
	        }
	
	        // TODO this should be a config option
	        popup.style.maxWidth = "600px";
	
	        /* reset the contents of the popup */
	        var xlate_loading = 
	        	baseui.loading_translation.replace("%S",a_alphtarget.getWord());
	        $("#alph-text",popup).remove();
	        $("#alph-window",topdoc).get(0).removeAttribute("alpheios-pending");
	        $("#alph-window",topdoc).append(
	            '<div id="alph-text"><div id="alph-text-loading">' +
	            xlate_loading +
	            '</div></div>'
	        );
	
	        // move the popup to just below the mouse coordinates
	        // (using height of current element isn't reliable because it might
	        //  a single element which contains a large block of text)
	        var buffer = 12;
	        if (a_elem)
	        {
	            pageY = pageY + buffer;
	        }
	
	        popup.style.left = pageX + "px";
	        popup.style.top = pageY + "px";
	        popup.style.display = "";
	        $(popup).attr("alph-orig-y",pageY-buffer);
	        xlate.repositionPopup(popup);
	        // add the original word to the browser's alpheios object so that the
	        // other functions can access it
	        // TODO HTML5 browser state
	        //alph_state.setVar("word",a_alphtarget.getWord());
	
	        var doc_array = [topdoc];
	        
	        //Alph.Main.d_panels['alph-morph-panel'].getCurrentDoc().forEach(
	        //    function(a_doc)
	        //    {
	        //        lang_tool.addStyleSheet(a_doc);
	        //        Alph.$("#alph-window",a_doc).css("display","block");
	        //        doc_array.push(a_doc);
	        //    }
	        //);
	        //Alph.Main.d_panels['alph-dict-panel'].getCurrentDoc().forEach(
	        //    function(a_doc)
	        //    {
	        //       lang_tool.addStyleSheet(a_doc);
	        //        Alph.$("#alph-window",a_doc).css("display","block");
	        //        doc_array.push(a_doc);
	        //    }
	        //);
	
	        // lookup the selection in the lexicon
	        // pass a callback to showTranslation to populate
	        // the popup and any other lexicon
	        // output browsers (i.e. in the morph panel)
	        // with the results on success,
	        // and a call back to translationError to populate
	        // the popup with an error message on failure
	        lang_tool.lexiconLookup(
	            a_alphtarget,
	            function(data)
	            {
	                xlate.showTranslation(data,a_alphtarget,doc_array,lang_tool);
	
	            },
	            function(a_msg)
	            {
	                xlate.translationError(a_msg,doc_array,lang_tool);
	            }
	        );
	    },
	
	    /**
	     * Hides the popup and removes the alpheios stylesheets from the
	     * browser content document.
	     * @param {Node} a_node - the node which contains the popup
	     */
	    hidePopup: function(a_node)
	    {
	    	// TODO HTML5 browser state
	        //var topdoc = a_node || this.getLastDoc();
	    	var topdoc = a_node;
	        $("#alph-window",topdoc).css("display","none");
	        $("#alph-text",topdoc).remove();
	        xlate.clearSelection(topdoc);
	        // TODO HTML5 browser state
	        // remove the last word from the state
	        //var alph_state = Alph.Main.getStateObj();
	        //if (alph_state.getVar("enabled"))
	        //{
	        //    alph_state.setVar("lastWord", null);
	        //    alph_state.setVar("lastSelection",null);
	
	        //}
	        // TODO HTML 5 events
	        //Alph.Main.broadcastUiEvent(Alph.Constants.EVENTS.HIDE_POPUP);
	        // keep the last element in the state, so that we can find
	        // the popup (and stylesheets) again
	    },
	    
	    /**
	      * handle to initiate drag action for popup
	      * @param {Event} a_event the mousedown event
	      *  ('this' is the object the mouse is over)
	      */
	     dragPopup: function(a_e)
	     {
	        var handle_offset = $(this).offset();;
	        var data =
	            { start_x: a_e.pageX,
	              start_y: a_e.pageY,
	              handle_x: handle_offset.left - a_e.pageX,
	              handle_y: handle_offset.top - a_e.pageY,
	            };
	        $(this).parents("body").eq(0).bind(
	            'mouseup.alpheiosdrag',
	            data,
	            xlate.dropPopup);

	        $(this).parents("body").eq(0).bind(
	            'mousemove.alpheiosdrag',
	            data,
	            xlate.movePopup);
	        return false;
	    },

	    /**
	     * mousemove handler for dragging the popup
	     * @param {Event} a_event the mousemove event
	     * ('this' is the object the mouse is moving over)
	     */
	    movePopup: function(a_e)
	    {
	        // adjust the coordinates of the event
	        // so that the mouse stays in the location
	        // of the original mouse down event
	        a_e.pageX = a_e.pageX + a_e.data.handle_x;
	        a_e.pageY = a_e.pageY + a_e.data.handle_y;
	        var x_m = a_e.pageX - a_e.data.start_x;
	        var y_m = a_e.pageY - a_e.data.start_y;
	        $("#alph-window",this.ownerDocument).get(0).style.left =
	            (a_e.data.start_x + x_m) + 'px';
	        $("#alph-window",this.ownerDocument).get(0).style.top =
	            (a_e.data.start_y + y_m) + 'px';
	        return false;
	    },

	    /**
	     * mouseup handler for dropping the popup
	     * @param {Event} a_event the mouseup event
	     * ('this' is the object the mouse is over)
	     */
	    dropPopup: function(a_e){
	        $(this).unbind('.alpheiosdrag');
	        $(this).parents().unbind('.alpheiosdrag');
	        // adjust the coordinates of the event
	        // so that the mouse stays in the location
	        // of the original mouse down event
	        a_e.pageX = a_e.pageX + a_e.data.handle_x;
	        a_e.pageY = a_e.pageY + a_e.data.handle_y;
	        var x_m = a_e.pageX - a_e.data.start_x;
	        var y_m = a_e.pageY - a_e.data.start_y;
	        $("#alph-window",this.ownerDocument).get(0).style.left =
	            (a_e.data.start_x + x_m) + 'px';
	        $("#alph-window",this.ownerDocument).get(0).style.top =
	            (a_e.data.start_y + y_m) + 'px';
	    },
	    
	    /**
	     * reposition the popup to be in the viewport
	     * @param {Element} a_popup the popup element
	     */
	    repositionPopup: function(a_popup)
	    {
	        var popup_elem = $(a_popup).get(0);
	        if (!popup_elem || popup_elem.ownerDocument != xlate.getLastDoc())
	        {
	            // only reposition for the popup in the original browser window,
	            // not the alph-window elements in the various panels
	            return;
	        }
	        var current_offset = $(a_popup).offset();
	        
	        var below_the_fold = utils.belowTheFold(popup_elem);
	        var right_of_screen = utils.rightOfScreen(popup_elem);
	        
	        if (below_the_fold > 0)
	        {
	            // when calculating the starting y position for the popup
	            // always start from the original location of the mouse click
	            var floor = $(a_popup).attr("alph-orig-y");
	            if (typeof floor == "undefined" || floor == null)
	            {
	                floor = current_offset.top;
	            }
	            // move the floor up a little bit to try to clear the selected
	            // word -- unfortunately calculating the height of the selected word is not reliable
	            floor = floor - 12;
	     
	            // ceiling is the top of the viewport
	            var ceiling = popup_elem.ownerDocument.defaultView.pageYOffset;
	            
	            var new_top = floor - $(a_popup).height();
	            if (new_top < ceiling)
	            {
	                new_top = ceiling;
	            }
	            
	            popup_elem.style.top = new_top + 'px'; 
	        }
	        if (right_of_screen > 0)
	        {
	            var new_left = current_offset.left - right_of_screen;
	            if (new_left < 0)
	            {
	                new_left = 0;
	            }
	            popup_elem.style.left = new_left + 'px'; 
	        }
	    },
	    
	    getLastDoc : function() {
	    	// TODO HTML5 browser state
	    	return document;
	    },
	    
	    /**
	     * Displays an error in the popup. Supplied as a callback argument
	     * to the {@link Alph.LanguageTool#lexiconLookup} method.
	     * @param {String} a_msg the error message
	     * @param a_doc_array Array of Documents which holds the morphological details
	     * @param a_lang_tool the Alph.Language object which initiated the lookup
	     */
	    translationError: function (a_msg,a_doc_array)
	    {
	        var err_msg = baseui.loading_error.replace("%S",a_msg);
	        logger.error("Query Response (Error): " + err_msg);
	        //if (Alph.Main.useLocalDaemon() &&
	        //    typeof Alph.Main.getCurrentBrowser()
	        //                  .alpheios.daemonPid == "undefined")
	        //{
	        //    err_msg = err_msg + '<br/>' + Alph.Main.getString("alph-error-mhttpd-notstarted");
	        //}

	        // the first document in the array is the main one
	        var a_topdoc = a_doc_array[0];

	        a_doc_array.forEach(
	           function(a_doc)
	           {
	                $("#alph-text-loading",a_doc).remove();

	                // replace any earlier error
	                $("#alph-loading-error",a_doc).remove();

	                $("#alph-text",a_doc).append(
	                    '<div id="alph-loading-error">' +
	                    err_msg +
	                    '</div>'
	                );
	           }
	       );
	        // TODO HTML5 events
	       //Alph.Main.broadcastUiEvent(Alph.Constants.EVENTS.SHOW_TRANS);
	    },
	    /**
	     * Shows the results of the lexicon lookup in the popup.
	     * Supplied as a callback argument to the
	     * {@link Alph.LanguageTool#lexiconLookup} method.
	     * @param {String} a_xml the xml string containing the lexicon response
	     * @param {Object} a_alphtarget the details on the target of the event which triggered the popup
	     *                 (as returned by {@link Alph.LanguageTool#findSelection})
	     * @param a_doc_arry the array of documents which contain the morphological text
	     * @param a_lang_tool the Alph.Language object which initiated the lookup
	     */
	    showTranslation: function(a_xml,a_alphtarget,a_doc_array,a_lang_tool) {

	        // the first document in the array is the main one
	        var a_topdoc = a_doc_array[0];

	        var wordHTML = xlate.transform(a_xml);

	        // don't display an empty popup
	        if (   (wordHTML == '')
	            || (   ($(".alph-entry",wordHTML).size() == 0)
	                && ($(".alph-unknown",wordHTML).size() == 0)
	                && ($(".alph-error",wordHTML).size() == 0)))
	        {
	            logger.warn("No valid entries to display.");
	            a_doc_array.forEach(
	                function(a_doc)
	                {
	                    xlate.hidePopup(a_doc);
	                }
	            );
	        }

	        // add a class to the first word in the response
	        $("div.alph-word:first",wordHTML).addClass("alph-word-first");

	        a_doc_array.forEach(
	            function(a_doc)
	            {

	                $("#alph-text",a_doc).remove();
	            }
	        );

	        var alphtext_node =
	            a_topdoc.importNode(
	                                        wordHTML.getElementById("alph-text"),
	                                        true);
	        var disambiguate_id = null;
	        if (a_alphtarget.getTreebankQuery())
	        {
	            disambiguate_id =
	                (new Date()).getTime()
	                + encodeURIComponent(a_alphtarget.getWord());
	        }
	        a_lang_tool.postTransform(alphtext_node);
	        // TODO HTML5 query functionality
	        //if (Alph.Interactive.enabled())
	        //{
	        //    Alph.$("#alph-window",a_topdoc).addClass("query-pending");
	        //}

	        a_doc_array.forEach(
	            function(a_doc)
	            {
	                var alph_node = $("#alph-window",a_doc);
	                if (disambiguate_id)
	                {
	                    alph_node.attr("alpheios-pending",
	                                                      disambiguate_id);
	                }
	                alph_node.append(
	                                                $(alphtext_node).clone());
	                // add the key to the language tool to the element
	                $("#alph-text",alph_node).attr('alph-lang',
	                    a_lang_tool.d_sourceLanguage);
	                // add language-specific click handler, if any
	                a_lang_tool.contextHandler(a_doc);

	                $("#alph-text",alph_node).prepend(
	                                                '<div id="alph-word-tools"/>');
	                a_lang_tool.addWordTools(
	                    $("#alph-text",alph_node),
	                    a_alphtarget);

	                a_lang_tool.addInflHelp(
	                    $("#alph-text",alph_node),
	                    a_alphtarget);
	                xlate.repositionPopup(alph_node);
	            }
	        );


	        var rp = a_alphtarget.getRangeParent();

	        // re-highlight the translated range in the source document
	        // This code fails for an svg element; For now just skip it
	        // but we should eventually also highlight the selection within the svg
	        if (rp && ! rp instanceof SVGElement)
	        {
	            var doc = rp.ownerDocument;
	            var r = doc.createRange();
	            r.setStart(rp, a_alphtarget.getWordStart());
	            r.setEnd(rp, a_alphtarget.getWordEnd());
	            var sel = doc.defaultView.getSelection();
	            sel.removeAllRanges();
	            sel.addRange(r);
	        }

	        // focus on the popup window so that we make sure our event handlers
	        // are going to be invoked (i.e. if a textbox elsewhere is focused, the keydown
	        // event listener might be hijacked) See Bug 149.
	        $("#alph-window-anchor",a_topdoc).focus();
	        // TODO - we probably should reposition the popup now that we
	        // know it's final size

	        
	        // disambiguate if treebank is available
	        if (disambiguate_id)
	        {
	            logger.debug("Disambiguating ..." +
	                          a_alphtarget.getTreebankQuery());
	            // send asynchronous request to the lexicon service
	            $.ajax(
	                {
	                    type: "GET",
	                    url: a_alphtarget.getTreebankQuery(),
	                    timeout: butils.getPref("url_treebank_timeout") || 5000,
	                    dataType: 'html',
	                    error: function(req,textStatus,errorThrown)
	                    {
	                        logger.error("Error disambiguating morphology: " +
	                                      textStatus||errorThrown);
	                        a_doc_array.forEach(
	                            function(a_doc)
	                            {
	                                try
	                                {
	                                    $("#alph-window[alpheios-pending="+
	                                           disambiguate_id+"]",
	                                           a_doc).get(0).removeAttribute(
	                                                            "alpheios-pending");
	                                }
	                                catch(a_e)
	                                {
	                                    //it's possible that a new request came in and removed the
	                                    // attribute, so quietly ignore error removing it
	                                }
	                            }
	                        );
	                        // TODO HTML5 events
	                        //Alph.Main.broadcastUiEvent(Alph.Constants.EVENTS.SHOW_TRANS);
	                    },
	                    success: function(data, textStatus)
	                    {

	                        xlate.updateTranslation(disambiguate_id,
	                                                     data,
	                                                     a_alphtarget,
	                                                     a_doc_array,
	                                                     a_lang_tool);
	                    }
	                }
	            );
	        }
	        else
	        {
	        	// TODO HTML5 events and queyr
	            //Alph.Main.broadcastUiEvent(Alph.Constants.EVENTS.SHOW_TRANS);
	            //if (! Alph.Interactive.enabled())
	            //{
	            //    a_lang_tool.addToWordList(Alph.$("#alph-window #alph-text",a_topdoc),false,false);
	            //}
	            //Alph.Interactive.openQueryDisplay(a_topdoc,a_alphtarget,a_lang_tool);
	        }

	    },
	    /**
	     * Update the results of the lexicon lookup in the popup.
	     * @param {String} a_req_id unique identifier for the disambiguate request
	     * @param {String} a_xml the xml string containing the lexicon response
	     * @param {Object} a_alphtarget the details on the target of the event which triggered the popup
	     *                 (as returned by {@link Alph.LanguageTool#findSelection})
	     * @param a_doc_array the array of Documents which contain the morphological text
	     * @param a_lang_tool the Alph.Language tool which initiated the request
	     */
	     updateTranslation: function(a_req_id,
	                                 a_xml,
	                                 a_alphtarget,
	                                 a_doc_array,
	                                 a_lang_tool)
	     {
	        logger.debug("Query response:" + a_xml);

	        // the first document in the array is the main one
	        var a_topdoc = a_doc_array[0];

	        var wordHTML = xlate.transform(a_xml);
	        // just quietly display the morpheus output if the treebank query
	        // returned an error or didn't include any data
	        // note that not all parts of speech include inflection data
	        // so we need to check for the presence of a dictionary entry
	        if (   (wordHTML == '') ||
	               $(".alph-dict",wordHTML).length == 0)
	        {
	            a_doc_array.forEach(
	                function(a_doc)
	                {
	                    try
	                    {
	                        $("#alph-window[alpheios-pending="+a_req_id+"]",
	                                   a_doc).get(0).removeAttribute("alpheios-pending");
	                    }
	                    catch(a_e){
	                        //it's possible that a new request came in and removed the
	                        // attribute, so quietly ignore error removing it
	                    }
	                }
	            );
	            logger.warn("No treebank entries to display.");
	        }
	        else
	        {

	            var new_text_node =
	                    window.content.document.importNode(
	                    $("#alph-text",wordHTML).get(0),true);

	            a_lang_tool.postTransform(new_text_node);
	            a_lang_tool.contextHandler(new_text_node);
	            a_lang_tool.addInflHelp(
	                    new_text_node,a_alphtarget);
	            var new_entries = $(".alph-entry",new_text_node);
	            

	            // iterate through the documents containing the morphology results
	            // merging the disambiguated output into the original results
	            // in each document
	            for (var j=0; j<a_doc_array.length;j++)
	            {
	                var a_doc = a_doc_array[j];
	                
	                // if a request for a new word came in while waiting for the response
	                // to the disambiguation requestion, the alpheios-pending attribute
	                // won't match and we will just discard the disabmiguation
	                // results rather than trying to merge them into a new words' results
	                var popup =
	                        $("#alph-window[alpheios-pending=" + a_req_id +
	                                "] #alph-text",a_doc);
	                if (popup.length == 0)
	                {
	                    logger.warn("Discarding disamibuguation " + a_req_id);
	                    continue;
	                }

	                // remove the old word tool icons from the popup, we need to refresh
	                // them with new tools after we incorporate the disambiguated output
	                $("#alph-word-tools",popup).remove();
	                var final_word_set = [];

	                for (var e_index=0; e_index < new_entries.length; e_index++)
	                {
	                    var new_entry = new_entries.eq(e_index);
	                    var new_dict = Alph.$(".alph-dict",new_entry);
	                    var new_hdwd = Alph.$(new_dict).attr("lemma-key");
	                    var new_infl_node =
	                        $(".alph-infl",new_entry).get(0);
	                    var new_pofs = $('.alph-pofs',new_entry).attr('context');
	                    // try to find an entry with the same lemma and replace the
	                    // contents of the first inflection set for that entry
	                    // with the treebank output
	                    var lemma_match_set =
	                        $(".alph-dict[lemma-key=" + new_hdwd +"]",popup)
	                        .parents(".alph-entry");
	    
	                    // if we didn't have a match, and the treebank lemma has a 1
	                    // at the end of it (which means 1st sense in the dictionary entry)
	                    // drop the 1 and try again
	                    if (lemma_match_set.length == 0 && new_hdwd.match(/1$/))
	                    {
	                        new_hdwd = new_hdwd.replace(/1$/,'');
	                    }
	    
	                    lemma_match_set =
	                        $(".alph-dict[lemma-key=" + new_hdwd +"]",popup)
	                        .parents(".alph-entry");
	                    var pofs_match_set = [];
	                    if (lemma_match_set.length >0)
	                    {
	                        pofs_match_set =
	                            $('.alph-dict .alph-pofs[context='+new_pofs+']',lemma_match_set)
	                                .parents('.alph-entry');
	                        // if no matching lemma entries with matching part of speech
	                        // at the dictionary level were found, check the pofs at the
	                        // inflection set level
	                        if (pofs_match_set.length == 0)
	                        {
	                            pofs_match_set =
	                                $('.alph-infl-set .alph-pofs[context='+new_pofs+']',
	                                    lemma_match_set).parents('.alph-entry');
	                        }
	                    }
	                    else
	                    {
	                        logger.warn("Can't find entry matching treebank lemma: " + new_hdwd);
	                    }
	                    // if entries with matching part of speech and lemma were
	                    // found, just use the new entry -- we'll lose details
	                    // on the inflection but they wouldn't be right anyway
	                    if (pofs_match_set.length == 0)
	                    {
	                        logger.warn("Can't find entry matching treebank lemma: " + new_hdwd
	                            + " and pofs: " + new_pofs);
	                        final_word_set.push(
	                            $(new_entry).parent(".alph-word").clone(true));
	                    }
	                    else
	                    {
	                        var good_entries = 0;
	                        // if we still have multiple matching entries at this point,
	                        // which seems unlikely, we may keep both if inflection
	                        // details match in both; iterate through them
	                        // looking for the matching inflection
	                        for (var i=0; i<pofs_match_set.length; i++)
	                        {
	                            var entry_match = pofs_match_set[i];
	                            var morph_pofs =
	                                $('.alph-dict .alph-pofs',entry_match)
	                                    .attr('context');
	    
	                            // if the part of speech indicated by the
	                            // treebank differs from the original
	                            // replace the entire dictionary section
	                            // (conj and declension will likely also be wrong
	                            // - but these aren't identified by the treebank)
	                            if (morph_pofs != new_pofs)
	                            {
	                                $('.alph-dict',entry_match)
	                                    .before($(new_dict).clone(true))
	                                    .remove();
	                            }
	                            
	                            var infl_set_possible = $(".alph-infl-set",entry_match);
	                            var infl_set_matches = [];
	    
	                            for (var k=0; k<infl_set_possible.length;k++)
	                            {
	                                var infl_set = infl_set_possible[k];
	                                // insert the new inflection only into
	                                // an inflection set of the same part of speech
	                                // as the new entry
	                                 var infl_pofs =
	                                    $(".alph-pofs",infl_set)
	                                        .attr('context')
	                                    || morph_pofs;
	                                if (infl_pofs ==
	                                    $('.alph-pofs',new_entry).attr('context'))
	                                {
	                                    infl_set_matches.push(k);
	                                }
	                                // TODO we should test gender here too....
	                            }
	                            // if we found a single matching inflection set, let's
	                            // just use it - chances are it is right
	                            if (infl_set_matches.length == 1)
	                            {
	                                var matched_infl_set =
	                                    $(infl_set_possible).eq(infl_set_matches[0]);
	                                $('.alph-infl',matched_infl_set).remove();
	                                if (new_infl_node != null)
	                                {
	                                    $(matched_infl_set)
	                                        .append($(new_infl_node).clone(true));
	                                }
	                                $(matched_infl_set).siblings(".alph-infl-set").remove();
	                                good_entries = 1;
	                                $(entry_match).attr("tb-match",true);
	                            }
	                            // if we have multiple matching inflection sets,
	                            // prefer one which contains an matching inflection
	                            else if (infl_set_matches.length >1)
	                            {
	                                var merge_sets = [];
	                                for (var k=0; k<infl_set_matches.length;k++)
	                                {
	                                    merge_sets.push(
	                                        $(infl_set_possible).eq(infl_set_matches[k])
	                                        .clone(true));
	                                }
	                                // remove all the old inflection sets, we're going
	                                // to replace them with only inflection sets with
	                                // matching inflections
	                                $(infl_set_possible).remove();
	                                merge_sets.forEach(
	                                    function(a_infl_set)
	                                    {
	                                        var matches = 0;
	                                        $(".alph-infl",a_infl_set).each(
	                                            function(a_i)
	                                            {
	                                                if (a_lang_tool.matchInfl(new_infl_node,this))
	                                                {
	                                                    matches++;
	                                                }
	                                            }
	                                        );
	                                        if (matches > 0)
	                                        {
	                                            $('.alph-infl',a_infl_set).remove();
	                                            $(a_infl_set)
	                                                .append($(new_infl_node).clone(true));
	                                            $(entry_match).append(a_infl_set);
	                                            good_entries++;
	                                            $(entry_match).attr("tb-match",true);
	                                        }
	                                    }
	                                );
	                            }
	                            else
	                            {
	                                // if we don't have any matching inflection sets
	                                // just drop them all .. we'll create a new one
	                                $(infl_set_possible).remove();
	                            }
	                        } // end iteration through matching entries
	    
	                        if (good_entries == 0)
	                        {
	                            // if we couldn't find any matching inflection sets, then
	                            // just use the first matching entry, and create a new
	                            // inflection set
	                            for (var i=1; i<pofs_match_set.length; i++)
	                            {
	                                $(pofs_match_set[i]).remove();
	                            }
	                            pofs_match_set = pofs_match_set.eq(0);
	                            $(pofs_match_set).attr("tb-match",true);
	                            if (new_infl_node != null)
	                            {
	                                var original_form =
	                                    $(pofs_match_set).parents(".alph-word").attr("context");
	                                $(new_infl_node).clone(true).appendTo(pofs_match_set);
	                                $(".alph-infl",pofs_match_set)
	                                    .wrap('<div class="alph-infl-set" context="' + original_form + '"></div>',a_doc);
	                            }
	                        }
	                        // remove any entries which didn't match
	                        $(".alph-entry:not([tb-match])",popup).remove();
	    
	                        for (var i=0; i<pofs_match_set.length; i++)
	                        {
	                           var entry_match = pofs_match_set[i];
	    
	                           // remove any pofs on the inflection set because
	                           // disambiguated output will always list the pofs
	                           // of the dictionary entry as the pofs of the inflection set
	                            $(".alph-infl-set .alph-pofs",entry_match).each(
	                                function()
	                                {
	                                    var next = $(this).next('.alph-formatting');
	                                    var prev = $(this).prev('.alph-formatting');
	                                    var next_comma = next.text().match(/,/);
	                                    var prev_comma = prev.text().match(/,/);
	                                    if ((next_comma && prev_comma) || next_comma)
	                                    {
	                                        // if at the beginning or middle of a list, remove only the comma which follows
	                                        $(next).remove();
	                                    }
	                                    else if (prev_comma)
	                                    {
	                                        // if it's 2nd in the list, remove the preceeding comma
	                                        $(prev).remove();
	                                    }
	                                    else
	                                    {
	                                        // it's the only thing in the list, so remove surrounding parens
	                                        $(next).remove();
	                                        $(prev).remove();
	                                    }
	                                    $(this).remove();
	                                }
	                            );
	                           
	                           if ($(".alph-infl-set",entry_match).length == 0)
	                           {
	                                // if we don't have any inflection set at all, make
	                                // sure we remove the form label from the popup too
	                                Alph.$(".alpheios-form-label",entry_match).remove();
	                            }
	                        }
	                        final_word_set.push(
	                            $(pofs_match_set).parents(".alph-word").clone(true));
	                    }

	                }
	                // remove all the old word elements from the popup                 
	                $(".alph-word",popup).remove();
	                // remove any unknown response from the non-disambiguated results
	                $(".alph-unknown",popup).remove();
	                // iterate through the final word elements, adding them
	                // back into the popup
	                for (var i=0; i<final_word_set.length; i++)
	                {
	                    var word = final_word_set[i];
	                    if (i == 0)
	                    {
	                        $(word).addClass("alph-word-first");
	                    }
	                    else
	                    {
	                        Alph.$(word).removeClass("alph-word-first");
	                    }
	                    $(word).addClass("tb-morph-word")
	                    $('#alph-morph-credits',popup).before(word);
	                }
	                $(popup).prepend('<div id="alph-word-tools"/>');
	                a_lang_tool.addWordTools(Alph.$(popup),a_alphtarget);
	                // add the treebank credits
	                var tb_credit = a_lang_tool.getString("treebank.credits");
	                $("#alph-morph-credits",popup).append('<div id="alph-treebank-credits">' +
	                        tb_credit + '</div>');
	                    
	                // we're finally done, so get rid of the pending status on the
	                // popup
	                try
	                {
	                    $("#alph-window[alpheios-pending="+a_req_id+"]",
	                               a_doc).get(0).removeAttribute("alpheios-pending");
	                    xlate.repositionPopup($("#alph-window",a_doc));
	                    
	                }
	                catch(a_e)
	                {
	                    //it's possible that a new request came in and removed the
	                    // attribute, so quietly ignore error removing it
	                }
	            }
	        }

	        $("#alph-window-anchor",a_topdoc).focus();
	        //Alph.Main.broadcastUiEvent(Alph.Constants.EVENTS.SHOW_TRANS);
	        //if (! Alph.Interactive.enabled())
	        //{
	        //    a_lang_tool.addToWordList(Alph.$("#alph-window #alph-text",a_topdoc),false,false);
	        //}
	        //Alph.Interactive.openQueryDisplay(a_doc_array[0],a_alphtarget,a_lang_tool);
	    },
	    /**
	     * Transforms xml text adhering to the alpheios schema to html
	     * TODO transform stylesheet may need to be language specific
	     * @private
	     * @param {String} a_text the text to be transformed
	     * @returns an HTML Node containing the transformed text
	     * @type Node
	     */
	    transform: function(a_text)
	    {
	        var wordHTML = '';
	        try
	        {
	            var wordXML = (new window.DOMParser()).parseFromString(a_text,"text/xml");
	            wordHTML = this.d_xsltProcessor.transformToDocument(wordXML);
	        }
	        catch (e)
	        {
	            logger.error(e);
	        }
	        return wordHTML;
	    },
	    /**
	     * Clears the last selection
	     * @param {Document} a_doc the source document
	     */
	     clearSelection: function(a_doc)
	     {
	        if (typeof a_doc == 'undefined')
	        {
	            a_doc = this.getLastDoc();
	        }

	        try {
	            a_doc.defaultView.getSelection().removeAllRanges();
	        }
	        catch(a_e)
	        {
	            //TODO sometimes we get a null defaultView. Need to figure
	            // out why and fix, rather than just logging it.
	            Alph.Main.s_logger.error("no default view");
	        }
	     },
	     
	     /**
	      * Opens or replaces a popup window and adds a reference to it to the
	      * alpheios state variable on the current browser.
	      *  @param {String} a_name the name of the new window
	      *  @param {String} a_url the url to load in the window
	      *  @param {Properties} a_feature optional feature properties for the window
	      *  @param {Array} a_window_args optional array of arguments to pass
	      *                                to the new window
	      *  @param {function} a_start_call optional callback to be executed
	      *                                 just before opening the window
	      *  @param {Array} a_start_args optional array of arguments to pass to the
	      *                              a_start_call callback
	      *  @param {function} a_load_call optional callback to be installed as an
	      *                                onload event handler in the new window
	      *  @returns the window
	      */
	     openSecondaryWindow: function(
	         a_name,
	         a_url,
	         a_features,
	         a_window_args,
	         a_start_call,
	         a_start_args,
	         a_load_call)
	     {

	         // the target window can call the passed in function
	         // to remove the loading message

	         // it doesn't seem possible to reset the window.arguments
	         // so if arguments are being passed to the new window,
	         // just proceed as if opening a new window
	    	 // TODO HTML5 window state
	         //var windows =
	         //    Alph.Main.getStateObj(Alph.Main.getCurrentBrowser())
	         //    .getVar("windows");

	         //var a_window = windows[a_name];
	         var a_window = null;
	         var update_args  = false;
	         var open_new_window = true;
	         try {
	             // if the window exists already, is open, has the same location
	             // and an update_args_callback property has been added to
	             // the window arguments, just call that with the new arguments
	             // rather than reloading the window
	             update_args = ( 
	                 typeof a_window != "undefined" &&
	                 a_window != null &&
	                 ! a_window.closed &&
	                 a_window.location.href == a_url &&
	                 a_window.arguments &&
	                 a_window.arguments[0].update_args_callback != null); 
	         }
	         catch (a_e)
	         {
	             logger.error("Error checking window status for " + a_name + " : " + a_e);
	         }
	         try {
	             open_new_window = (typeof a_window == "undefined" || 
	                                 a_window == null || 
	                                 a_window.closed || 
	                                 a_window_args);
	         }
	         catch (a_e)
	         {
	             logger.error("Error checking open window status for " + a_name + " : " + a_e);
	         }

	         // if the window exists already, is open, has the same location
	         // and an update_args_callback property has been added to
	         // the window arguments, just call that with the new arguments
	         // rather than reloading the window
	         if (update_args)
	         {
	             logger.debug("Calling update_args_callback for window " + a_name);
	             a_window.arguments[0].updateArgsCallback(a_window_args);
	         }
	         // if the window doesn't exist, or is closed, or has arguments
	         // and didn't meet the prior condition,
	         // reload it with the new arguments
	         else if (open_new_window)
	         {

	             logger.debug("Opening new window named: " + a_name);
	             // add a loading message to notify the user we're loading
	             // the grammar - really this should come from a
	             // stringbundle if we're going to keep it
	             if (a_start_call != null) {
	                 a_start_call(a_start_args);
	             }

	             // set the feature string for the new window
	             // adding in any overrides from the arguments
	             // note that the chrome feature seems to impact
	             // the behavior of javascript installed in the chrome
	             // of the newly opened window
	             var features =
	             {
	                 chrome: "no", // TODO HTML5 chrome equivalent?
	                 dialog: "no",
	                 resizable: "yes",
	                 width: "800",
	                 height: "600",
	                 scrollbars: "yes"
	             };

	             for (var prop in a_features)
	             {
	                 // calculate actual screenX,screenY
	                 if (prop == 'screen') {
	                     var target_width;
	                     var target_height;
	                     if (a_features.width != null)
	                     {
	                         target_width = a_features.width;
	                     }
	                     else
	                     {
	                         target_width = features.width;
	                     }
	                     if (a_features.height != null)
	                     {
	                         target_height = a_features.height;
	                     }
	                     else
	                     {
	                         target_height = features.height;
	                     }

	                     var right_x = window.outerWidth - target_width;
	                     if (right_x < 0)
	                     {
	                         right_x = window.screenX;
	                     }
	                     var bottom_y = window.outerHeight - target_height;
	                     if ( bottom_y < 0 ){
	                         bottom_y = window.screenY;
	                     }
	                     logger.debug("Screen: " + a_features[prop]);
	                     switch(a_features[prop])
	                     {
	                         case "topright":
	                         {
	                             features.screenY = window.screenY;
	                             features.screenX = right_x;
	                             break;
	                         }
	                         case "bottomleft":
	                         {
	                             features.screenX = window.screenX;
	                             features.screenY = bottom_y;
	                             break;
	                         }
	                         case "bottomright":
	                         {
	                             features.screenX = right_x;
	                             features.screenY = bottom_y;
	                             break;
	                         }
	                         default: //"topleft"
	                         {
	                             features.screenX = window.screenX;
	                             features.screenY = window.screenY;
	                         }
	                     }
	                 }
	                 else
	                 {
	                     features[prop] = a_features[prop];
	                 }
	             };

	             var feature_list = [];
	             for (var prop in features)
	             {
	                 feature_list.push(
	                     prop + "=" + features[prop]);
	             }

	             a_window = window.open(
	                 a_url,
	                 a_name,
	                 feature_list.join(","),
	                 a_window_args
	                 );

	             // install the onload handler in the new window
	             if (a_load_call != null)
	             {
	            	 // TODO HTML5 HACK to hide loading message until
	            	 // panels and window state are managed
	            	     //a_window.addEventListener(
		                 //            "load",
		                 //            a_load_call,
		                 //            false);
	            	 	 a_load_call();
	             }
	         }
	         // the target window is already open, replace the location
	         else
	         {
	             var current_location = a_window.location;

	             var match_result =
	                 a_url.match(/^(\w+):\/\/([^\/]+)(\/\S*?)(#.+)?$/);
	             // if a match, full string is in match_result[0]
	             var target_host = match_result[2];
	             var target_path = match_result[3];
	             var target_hash = match_result[4];

	             // if the target url is the same as the current url
	             // and both specify a named location in the same file,
	             // replace just the hash part of the location to prevent
	             // reloading the window with the new location
	             if (target_hash != null &&
	                 current_location.host == target_host &&
	                 current_location.pathname == target_path &&
	                 a_window.location.hash != null &&
	                 a_window.location.hash != ''
	                 )
	             {
	                 logger.debug("Replacing location hash with " + target_hash);
	                 a_window.location.hash = target_hash;
	             }
	             // otherwise, just replace the location and allow the window
	             // to reload. It should come into focus before replacing the
	             // location, so adding loading message to the source window
	             // shouldn't be necessary
	             else
	             {
	                 logger.debug("Replacing location with " + a_url);
	                 a_window.location = a_url;

	             }

	         }
	         // now focus the window
	         a_window.focus();
	         logger.info("Secondary window should have focus at "+ a_url);
	         // TODO HTML5 window state
	         //windows[a_name] = a_window;
	         return a_window;
	     },

	     /**
	      * Callback to hide the loading message in the popup.
	      * @param {Document} document which contains the loading message
	      */
	     hideLoadingMessage: function(a_doc)
	     {

	         var topdoc = a_doc || xlate.getLastDoc();
	         try {
	             // we can't use the event target, because the event is
	             // in the 2ndary window not the one showing the message
	             $("#alph-secondary-loading",topdoc).remove();

	             // also check the morphology panel (dictionary window doesn't 
	             // contain any links to new windows)
	             // TODO HTML5 panels
	             //Alph.Main.d_panels['alph-morph-panel'].getCurrentDoc().forEach
	             //(
	             //    function(a_doc)
	             //    {
	             //        Alph.$("#alph-secondary-loading",a_doc).remove();
	             //    }
	             //);
	             
	             // TODO HTML5 Query
	             // and the query window
	             //var qdoc = Alph.Interactive.getQueryDoc();
	             //if (qdoc)
	             //{
	              //       Alph.$("#alph-secondary-loading",qdoc).remove();
	             //}
	         }
	         catch(e)
	         {
	             logger.error("Error hiding loading message: " + e);
	         }
	     },

	     /**
	      * Remove the alph-window element and related css from the
	      * browser content document
	      * @param a_bro the browser
	      * @param a_lang_tool the LanguageTool which last populated the alpheios
	      *                    elements in the browser (optional - if not supplied
	      *                    the current tool will be used)
	      */
	      removePopup: function(a_bro,a_lang_tool)
	      {
	         var last_doc = this.getLastDoc();
	         // remove the main alpheios stylesheet
	         $(".alpheios-css",last_doc).remove();
	         var main = require('main');
             
	         if (typeof a_lang_tool == "undefined")
	         {
	        	 a_lang_tool = main.getLanguageTool();
	         }
	         if (a_lang_tool)
	         {
	             a_lang_tool.removeStyleSheet(last_doc);
	         }
	         // remove the alpheios window element
	         $("#alph-window",last_doc).remove();

	         // TODO HTML5 panels
	         // also clear the morphology and dictionary panels
	         //main.d_panels['alph-morph-panel'].getCurrentDoc().forEach(
	         //    function(a_doc)
	         //    {
	         //        $("#alph-window",a_doc).html("");
	         //        if (a_lang_tool)
	         //        {
	         //            a_lang_tool.removeStyleSheet(a_doc);
	         //        }            
	         //    }
	         //);
	         //main.d_panels['alph-dict-panel'].getCurrentDoc().forEach(
	         //    function(a_doc)
	         //    {
	         //        $("#alph-window",a_doc).html("");
	         //        if (a_lang_tool)
	         //        {
	         //            a_lang_tool.removeStyleSheet(a_doc);
	         //        } 
	         //    }
	         //);

	         // TODO HTML5 events
	         //main.broadcastUiEvent(constants.EVENTS.REMOVE_POPUP);

	      },
	      
	      /**
	       * Determines if the popup is currently being displayed,
	       * based upon the lastElem object in the alpheios state variable
	       * @returns true if it was found and visible, otherwise false
	       * @type Boolean
	       */
	      popupVisible: function()
	      {
	         var topdoc = this.getLastDoc();
	         return $("#alph-window",topdoc).is(':visible');
	      },
	      
	      /**
	       * Show a loading message in the popup.
	       * @param {Array} a_args an arry containing
	       *                [0] - the Node at which to show the message
	       *                [1] - the message
	       */
	      showLoadingMessage: function(a_args)
	      {
	          if ($("#alph-secondary-loading",a_args[0]).length == 0 )
	          {
	              $(a_args[0]).append(
	                  '<div id="alph-secondary-loading">' + a_args[1] + '</div>');
	          }
	      }


	};
	return (xlate);
});
