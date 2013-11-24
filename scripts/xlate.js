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
define(['jquery','main'], function($,main) {
	return {
    
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
	            this.clearSelection();
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

	            this.clearSelection();
	            return;
	        }        
	        //var browser = Alph.Xlate.getBrowser(rp);
	        
	        //var alphtarget = main.getLanguageTool(browser,a_e.explicitOriginalTarget).findSelection(ro,rngstr);

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
	//        this.showPopup(a_e,alphtarget);
	        alert("ShowPopup " + a_e);
	    }
	};
});
