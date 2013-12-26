/**
 * @fileoverview Access data from a sorted file. Supports binary search.  
 * Exports a single symbol, Datafile, which must be imported into the 
 * namespace of the importing class.
 *
 * @version $Id: alpheios-datafile.jsm 3767 2010-08-04 23:28:27Z BridgetAlmas $
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
 * @class Datafile contains the datafile lookup functionality.
 * @constructor
 *
 * @param {String} a_url URL to read
 * @param {String} a_charset character set (or null for no conversion)
 */
define(['logger','browser-utils'], function(logger,butils) {

	function Datafile(a_url, a_charset, a_callback) {
	    // save parameters for possible future reload
	    this.d_url = a_url;
	    this.d_charset = a_charset;
	    this.d_separator = '|';
	    this.d_specialFlag = '@';
	    logger.info("Reading file " + a_url);
	    var fileRef = this;
	    var dataRef = a_callback;
	    butils.readFile(
	    		a_url,
	    		a_charset,
	    		'text',
	    		function(a_data,a_status){
	    			fileRef.d_data = a_data;
	    			// make sure file ends with newline
	    		    if (fileRef.d_data[fileRef.d_data.length - 1] != '\n') {
	    		        fileRef.d_data += '\n';
	    			}
	    		    dataRef.data[dataRef.index] = fileRef;
				},
				null,
				null);
	}

	Datafile.prototype =
	{
	    /**
	     * get data
	     *
	     * @returns file contents
	     * @type String
	     */
	    getData: function()
	    {
	        return this.d_data;
	    },
	
	    /**
	     * get separator string
	     *
	     * @returns separator string
	     * @type String
	     */
	    getSeparator: function()
	    {
	        return this.d_separator;
	    },
	
	    /**
	     * set separator string
	     *
	     * @param {String} a_separator the separator
	     */
	    setSeparator: function(a_separator)
	    {
	        this.d_separator = a_separator;
	    },
	
	    /**
	     * get special handling flag
	     *
	     * @returns special handling flag
	     * @type String
	     */
	    getSpecialHandlingFlag: function()
	    {
	        return this.d_specialFlag;
	    },
	
	    /**
	     * set special handling flag
	     *
	     * @param {String} a_specialFlag the special handling flag
	     */
	    setSpecialHandlingFlag: function(a_specialFlag)
	    {
	        this.d_specialFlag = a_specialFlag;
	    },
	
	    /**
	     * do binary search in data
	     * 
	     * The data is assumed to be a sorted collection of newline-separated
	     * lines.  The key being searched for must be at the start of the line.
	     * The key/data separator is appended to the supplied key to ensure
	     * that the key is uniquely identified.
	     * 
	     * Multiple lines with the same key are allowed.  The offset of the first
	     * such line will be returned.
	     *
	     * @param {String} a_key   key to search for
	     * 
	     * @returns offset of key in data or -1 if not found
	     * @type int
	     */
	    binarySearch: function(a_key)
	    {
	        a_key += this.d_separator;
	
	        const tlen = a_key.length;
	        var mid;
	        var midStr;
	
	        // start with entire range of data
	        var beg = 0;
	        var end = this.d_data.length - 1;
	
	        // while data still remains
	        while (beg < end)
	        {
	            // find line containing midpoint of remaining data
	            mid = this.d_data.lastIndexOf('\n', (beg + end) >> 1) + 1;
	            midStr = this.d_data.substr(mid, tlen);
	            // if too high, restrict to first half
	            if (a_key < midStr) {
	                end = mid - 1;
	            }
	            // if too low, restrict to second half
	            else if (a_key > midStr) {
	                beg = this.d_data.indexOf('\n', mid) + 1;
	            }
	            // if equal, done
	            else
	                break;
	        }
	        
	        // if found, back up to first line with key
	        if (beg < end)
	        {
	
	
	            // while non-empty preceding line exists
	            while (mid >= 2)
	            {
	                // find start of preceding line
	                var prec = this.d_data.lastIndexOf('\n', mid - 2) + 1;
	
	                // if preceding line has different key then done,
	                // else back up to preceding line
	                midStr = this.d_data.substr(prec, tlen);
	                if (a_key != midStr)
	                    break;
	                mid = prec;
	            }
	
	            return mid;
	        }
	
	        // not found
	        return -1;
	    },
	
	    /**
	     * find data by key
	     *
	     * The data is assumed to be suitable for search using #binarySearch
	     * 
	     * @param {String} a_key    key to search for
	     * 
	     * @returns subset of data matching key, else null
	     * @type String
	     *
	     */
	    findData: function(a_key)
	    {
	        // if key not found at all, return empty string
	        var start = this.binarySearch(a_key);
	        if (start == -1)
	            return null;
	
	        a_key += this.d_separator; 
	        const tlen = a_key.length;
	        var end = start;
	
	        // while more lines remain
	        while (end < this.d_data.length)
	        {
	            // find start of next line
	            end = this.d_data.indexOf('\n', end) + 1;
	            if (end == 0)
	                end = this.d_data.length;
	
	            // if next line has different key then done,
	            // else include this line in output
	            // make sure to look at the entire string up to the 
	            // separator in case the key is found as the beginning
	            // of the word on the next line 
	            var test = this.d_data.substr(end, tlen);
	            if (a_key != test)
	                break;
	        }
	
	        return this.d_data.substring(start, end);
	    }
	};
	return(Datafile);
});
