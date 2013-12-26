/**
 * @fileoverview Greek specific string conversion methods 
 * Exports a single symbol, ConvertGreek which must be imported into the namespace 
 * of the importing class.
 *
 * @version $Id: alpheios-convert-greek.jsm 2140 2009-10-05 12:05:48Z BridgetAlmas $
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
 * @class Greek string conversion class
 * @extends Convert
 */
define(['browser-utils','logger','convert','sarissa/sarissa'], function(butils,logger,Convert,Sarissa) {
	
	function ConvertGreek() {
	    Convert.call(this);
	    /* initialize the XSLT converters */
	    var thisObj = this;
	    butils.getXsltProcessor('alpheios-uni2betacode.xsl',null,
	    		function(a_processor) {
	        		thisObj.d_u2bConverter = a_processor;	
	        	}
	    );
	    butils.getXsltProcessor('alpheios-normalize-greek.xsl',null,
	    		function(a_processor) {
	        		thisObj.d_uNormalizer = a_processor;	
	        	}
	    );	
	};
	
	ConvertGreek.prototype = new Convert();
	
	/**
	 * greek ascii transliteration (unicode to betacode)
	 * @param {String} a_str the string to convert
	 * @returns the converted string
	 * @type {String}
	 */
	ConvertGreek.prototype.greekToAscii = function(a_str)
	{
	    var betaText = '';
	    try
	    {
	    	this.d_u2bConverter;
	        var dummy = (new window.DOMParser()).parseFromString("<root/>","text/xml");
	        this.d_u2bConverter.setParameter(null, "e_in", a_str);
		    var tmpDoc = this.d_u2bConverter.transformToDocument(dummy); 
		    betaText = $.trim(tmpDoc.documentElement.textContent);
	    }
	    catch (e)
	    {
	        logger.error(e);
	    }
	    return betaText;
	};
	
	/**
	 * greek normalization (precomposed/decomposed Unicode)
	 * @param {String} a_str the string to normalize
	 * @param {Boolean} a_precomposed whether to output precomposed Unicode
	 *   (default = true)
	 * @param {String} a_strip characters/attributes to remove
	 *   (specified as betacode characters - e.g. "/\\=" to remove accents)
	 *   (default = no stripping)
	 * @param {Boolean} a_partial whether this is partial word
	 *   (if true, ending sigma is treated as medial not final)
	 *   (default = false)
	 * @returns the normalized string
	 * @type {String}
	 */
	ConvertGreek.prototype.normalizeGreek = function(a_str, a_precomposed, a_strip, a_partial)
	{
	    // set defaults for missing params
	    if (typeof a_precomposed == "undefined")
	        a_precomposed = true;
	    if (typeof a_strip == "undefined")
	        a_strip = "";
	    if (typeof a_partial == "undefined")
	        a_partial = false;
	
	    var normText = '';
	    try
	    {
	        this.d_uNormalizer.setParameter(null, "e_in", a_str);
	        this.d_uNormalizer.setParameter(null,
	                                        "e_precomposed",
	                                        (a_precomposed ? 1 : 0));
	        this.d_uNormalizer.setParameter(null, "e_strip", a_strip);
	        this.d_uNormalizer.setParameter(null,
	                                        "e_partial",
	                                        (a_partial ? 1 : 0));
	        var dummy = (new recent_win.DOMParser()).parseFromString("<root/>","text/xml");
	        normText = $.trim(this.d_uNormalizer.transformToDocument(dummy).documentElement.textContent);
	    }
	    catch (e)
	    {
	        logger.error(e);
	    }
	    return normText;
	};
	return(ConvertGreek);

});