/**
 * @fileoverview Defines the language containers for the alpheios extension.
 *
 * @version $Id: alpheios-languages.js 2138 2009-10-05 11:50:59Z BridgetAlmas $
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
 * @class Container for the instantiated instances of the {@link Alph.LanguageTool}
 * objects for each supported language. 
 */
define([], function() {
	return {
	    /**
	     * the list of supported languages
	     * @private
	     */
	    d_langList: [],
	    
	    /**
	     * get a language tool
	     * @param {String} a_lang the language key
	     * @returns the language tool
	     * @type {Alph.LanguageTool}
	     */
	    getLangTool: function(a_lang)
	    {
	        return this[a_lang];
	    },
	    
	    /**
	     * check to see if a language is supported
	     * @param {String} a_lang the language key
	     * @returns true or false
	     * @type Boolean
	     */
	    hasLang: function(a_lang)
	    {        
	        if (typeof this[a_lang] == "undefined")
	        {
	            return false;
	        }
	        else
	        {
	            return true;
	        }
	    },
	    
	    /**
	     * get the list of supported languages
	     * @returns list of supported languages
	     * @type Array
	     */
	    getLangList: function()
	    {
	        return this.d_langList;
	    },
	    
	    /**
	     * add a supported language
	     * @param {String} a_lang the language key
	     * @param {Alph.LanguageTool} the language tool
	     */
	    addLangTool: function(a_lang,a_lang_tool)
	    {
	        if (typeof this[a_lang] == "undefined")
	        {
	            this[a_lang] = a_lang_tool;
	            this.d_langList.push(a_lang);
	        }
	    },
	    
	    /**
	     * Get the key in to the Languages object for the supplied language code
	     * @param {String} a_code the language code
	     * @returns the key in to the Languages object for this code, or '' if none found
	     * @type String 
	     */
	    mapLanguage: function(a_code)
	    {
	        var lang_key = '';
	        for (var i=0; i<this.d_langList.length;i++)
	        {
	            var lang_tool = this.getLangTool(this.d_langList[i]);
	            if (a_code == this.d_langList[i] ||
	                lang_tool.supportsLanguage(a_code)
	            )
	            {
	                lang_key = this.d_langList[i];
	                break;
	            }
	        }
	        return lang_key;
	    }
	};
});