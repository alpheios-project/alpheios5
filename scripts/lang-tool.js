/**
 * @fileoverview This file defines the LanguageTool class prototype.
 *
 * @version $Id: alpheios-lang-tool.js 4136 2012-01-09 13:58:00Z bmalmas $
 *
 * Copyright 2008-2010 Cantus Foundation
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
 * @class  LanguageTool is the base class for language-specific
 * functionality.
 *
 * @constructor
 * @param {String} a_language  the source language for this instance
 * @param {Properties} a_properties additional properties to set as private members of
 *                                  the object (accessor methods will be dynamically created)
 */
define(['jquery','strings','main','logger','prefs','convert','constants','src-select','xlate','browser-utils','utils',"datafile","module"], 
		function($,strings,main,logger,prefs,Convert,constants,select,xlate,butils,utils,Datafile,module) {
	 /**
	  * @class  LanguageTool is the base class for language-specific
	  * functionality.
	  *
	  * @constructor
	  * @param {String} a_language  the source language for this instance
	  * @param {Properties} a_properties additional properties to set as private members of
	  *                                  the object (accessor methods will be dynamically created)
	  */
	 function LanguageTool(a_language,a_properties)
	 {
		 var langObj = this;
		 this.d_loadEvents = [];
	     this.d_sourceLanguage = a_language;
	     this.d_idsFile = Array();
	     this.d_defsFile = Array();

	     // TODO need to figure out which properties should be immutable.
	     // Use of the function calls to prefs.get allows the properties
	     // to change if the user modifies the preferences, but there may be
	     // some properties for which we can't allow changes without reinstantiating
	     // the object.
	     var default_properties =
	     {
	         ContextForward:
	             function()
	             {
	                 return langObj.getModule().config().context_forward || 0;
	             },
	         ContextBack:
	             function()
	             {
	                 return langObj.getModule().config().context_back || 0;
	             },
	         PkgName:
	             function()
	             {
	                 return langObj.getModule().config().chromepkg;
	             },
	         Language:
	             function()
	             {
	                 return a_language;
	             },
	         LanguageCode:
	             function()
	             {
	                 var codes = langObj.getModule().config().languagecode;
	                 if (codes)
	                 {
	                     // first code in list is the preferred code
	                     return codes.split(',')[0];
	                 }                
	             },
	         PopupTrigger:
	             function()
	             {
	                 // individual language may override the popuptrigger,
	                 // but they don't have to
	                 return langObj.getModule().config().popuptrigger;
	             },
	         UseMhttpd:
	             function()
	             {
	                 return langObj.getModule().config().usemhttpd;
	             },
	         GrammarLinks:
	             function()
	             {
	                 var grammarlinklist = {};
	                 var links = langObj.getModule().config().grammar_hotlinks;
	                 if (typeof links != "undefined")
	                 {
	                     links = links.split(/,/);
	                     for ( var i=0; i<links.length; i++)
	                     {
	                         grammarlinklist[links[i]] = true;
	                     }
	                 }
	                 return grammarlinklist;
	             },
	         Pofs:
	             function()
	             {
	                 var pofs = langObj.getModule().config().partsofspeech;
	                 if (pofs)
	                 {
	                     return pofs.split(/,/);
	                 }
	                 else
	                 {
	                     return [];
	                 }

	             },
	         Direction:
	             function()
	             {
	                 return langObj.getModule().config().textdirection;                
	             }
	             
	     };
	     this.setAccessors(default_properties);
	     this.setAccessors(a_properties);

	     // TODO - should the list of methods to call here to generate the
	     // language-specific functionality be automatically determined from
	     // the configuration?
	     this.setFindSelection();
	     this.setLexiconLookup();
	     this.setContextHandler();
	     this.setShiftHandler();
	     this.loadConverter();

	     var startup_methods = this.getModule().config().methods_startup;
	     if (typeof startup_methods != "undefined")
	     {
	         startup_methods = startup_methods.split(/,/);
	         for (var i=0; i<startup_methods.length; i++)
	         {
	             var method_name = startup_methods[i];
	             // is the method in the LanguageTool object?
	             if (typeof this[method_name] == 'function')
	             {
	                 logger.debug("Calling " + method_name + " for " + a_language);
	                 this[method_name]();
	                 // TODO should we throw an error if the startup method returns
	                 // false?
	             }
	             else
	             {
	                 logger.warn("Startup method " + method_name +
	                               " for " + a_language +
	                               " not defined");
	             }
	         }
	     }

	     this.lexiconSetup();


	 };

	 /**
	  * loads the converter object
	  * by default loads the base Alph.Convert object
	  * override to use a language-specific converter
	  */
	 LanguageTool.prototype.loadConverter = function()
	 {
	     this.d_converter = new Convert();  
	 };
	 
	 /**
	 * load lemma id lookup files
	 * @returns true if successful, otherwise false
	 * @type boolean
	 */
	LanguageTool.prototype.loadLexIds = function()
	{
		var langObj = this;
	    this.d_idsFile = Array();
	    this.d_fullLexCode = this.getModule().config().dictionaries_full.split(',');
	    var contentUrl = this.getModule().config().contenturl;
	    var langCode = this.getLanguageCode();
	    var langString = this.getLanguageString();

	    for (var i = 0; i < this.d_fullLexCode.length; ++i)
	    {
	        var lexCode = this.d_fullLexCode[i];
	        var fileName = contentUrl +
	                       '/dictionaries/' +
	                       lexCode +
	                       '/' +
	                       langCode +
	                       '-' +
	                       lexCode +
	                       "-ids.dat";
	        try
	        {
	        	langObj.push_load_event("load_"+lexCode+"_ids");
	            new Datafile(fileName, "UTF-8",
	            	{'data': this.d_idsFile,'index':i},
	            	function() { langObj.pop_load_event();}
	            );
	            
	        }
	        catch (ex)
	        {
	            // the ids file might not exist, in particular for remote,
	            // non-alpheios-provided dictionaries
	            // so just quietly log the error in this case
	            // later code must take a null ids file into account
	            logger.error("error loading " +
	                                langString +
	                                " ids from " +
	                                fileName +
	                                ": " +
	                                ex);
	            return false;
	        }
	    }
	    return true;
	}

	/**
	 * Initializes lexicon search parameters
	 */
	LanguageTool.prototype.lexiconSetup = function()
	{
	    // nothing to do if no language defined
	    var language = this.d_sourceLanguage;
	    if (!language || typeof language == "undefined")
	        return;

	    // read lexicon parameters
	    // look first for lexicon-specific values and then, if not found,
	    // for generic lexicon-independent values
	    logger.debug("Reading params for " + language);
	    this.d_lexiconSearch = Array();
	    var codeList;
	    try 
	    {
	        codeList = this.getModule().config().dictionaries_full;
	    }
	    catch(a_e){
	        // the preference might not be defined
	        codeList = null;
	    }
	    var codes = (codeList ? codeList.split(',') : Array());
	    var defaultBase = "dictionary_full_search_";
	    for (var i = 0; i < codes.length; ++i)
	    {
	        var code = codes[i];
	        var base = "dictionary_full_" + code + "_search_";
	        this.d_lexiconSearch[code] = Array();
	        this.d_lexiconSearch[code]["url"] =
	        	this.getModule().config()[base + "url"];

	        // if lexicon-specific URL is defined
	        if (this.d_lexiconSearch[code]["url"])
	        {
	            // read lexicon-specific values
	            this.d_lexiconSearch[code]["lemma"] =
	            	this.getModule().config()[base + "lemma_param"];
	            this.d_lexiconSearch[code]["id"] =
	            	this.getModule().config()[base + "id_param"];
	            this.d_lexiconSearch[code]["multiple"] =
	            	this.getModule().config()[base + "multiple"];
	            this.d_lexiconSearch[code]["convert"] =
	            	this.getModule().config()[base + "convert_method"];
	            this.d_lexiconSearch[code]["transform"] =
	            	this.getModule().config()[base + "transform_method"];
	        }
	        // else use lexicon-independent values
	        else
	        {
	            this.d_lexiconSearch[code]["url"] =
	            	this.getModule().config()[defaultBase + "url"];
	            this.d_lexiconSearch[code]["lemma"] =
	            	this.getModule().config()[defaultBase + "lemma_param"];
	            this.d_lexiconSearch[code]["id"] =
	            	this.getModule().config()[defaultBase + "id_param"];
	            this.d_lexiconSearch[code]["multiple"] =
	            	this.getModule().config()[defaultBase + "multiple"];
	            this.d_lexiconSearch[code]["convert"] =
	            	this.getModule().config()[defaultBase + "convert_method"];
	            this.d_lexiconSearch[code]["transform"] =
	            	this.getModule().config()[defaultBase + "transform_method"];
	        }
	    }
	};
	
	/**
	 * 
	 */
	LanguageTool.prototype.push_load_event = function(a_event) {
		this.d_loadEvents.push(a_event);
		logger.debug("Push " + this.d_sourceLanguage + " Load Event " + this.d_loadEvents.length.toString() + ":" + a_event );
	};

	LanguageTool.prototype.pop_load_event = function() {
		logger.debug("Pop " + this.d_sourceLanguage + " Load Event " + this.d_loadEvents.length.toString() );
		this.d_loadEvents.pop();
		if (this.d_loadEvents.length == 0) {
			$("#alpheios-loading").trigger("ALPHEIOS_LOAD_COMPLETE",this.d_sourceLanguage);
		}
	};
	
	LanguageTool.prototype.is_loading = function() {
		return this.d_loadEvents.length > 0;
	}

	 /**
	  * source langage for this instance
	  * this is used often, so its set as a regular property
	  * rather than wrapped in the auto-generated accessor methods
	  * @private
	  * @type String
	  */
	 LanguageTool.prototype.d_sourceLanguage = '';

	 /**
	  * Creates accessor methods on the instance for the
	  * supplied properties object
	  * @private
	  * @param {Properties} a_properties properties for which to set accessors
	  *                      if a property value is a function, this
	  *                      function will be called and its value returned
	  *                      by the get accessor, otherwise,the value will
	  *                      be returned as-is
	  */
	 LanguageTool.prototype.setAccessors = function(a_properties)
	 {
	     var myobj = this;
	     for ( var prop in a_properties )
	     {
	         ( function()
	         {
	             var myprop = prop;
	             myobj[ "get"+ myprop ] = function()
	             {
	                 if (typeof a_properties[myprop] == 'function')
	                 {
	                     return a_properties[myprop]();
	                 }
	                 else
	                 {
	                     return a_properties[myprop];
	                 }
	             };

	             myobj[ "set" + myprop ] = function(val)
	             {
	                 a_properties[myprop] = val;
	             };

	         }
	         )();
	     }
	 };

	 /**
	  * Sets the findSelection method for the instance of the class.
	  * This is derived according to the language-specific configuration.
	  * @see #findSelection
	  * @private
	  */
	 LanguageTool.prototype.setFindSelection = function()
	 {
	     // get the base unit
	     // default to 'word' if not defined
	     var base_unit =
	    	 this.getModule().config()['base_unit'] || 'word';
	     if (base_unit == 'word')
	     {
	         /**
	          * @ignore
	          */
	         this.findSelection = function(a_ro, a_rangstr)
	             {
	                 var alphtarget = this.doSpaceSeparatedWordSelection(a_ro, a_rangstr);
	                 return this.handleConversion(alphtarget);
	             }
	     }
	     else if (base_unit == 'character')
	     {
	         /**
	          * @ignore
	          */
	         this.findSelection = function(a_ro, a_rangstr)
	             {
	                 var alphtarget = this.doCharacterBasedWordSelection(a_ro, a_rangstr);
	                 return this.handleConversion(alphtarget);
	             }
	     }
	     else
	     {
	         // unknown
	     }
	 };

	 /**
	  * Given a string and an offset into that string find the word or words
	  * which encompass the range offset (to be fed to a lexicon tool).
	  * @param {int} a_ro the range offset
	  * @param {String} a_rngstr the string of characters containing the range offset
	  * @returns {@link Alph.SourceSelection} object
	  * @type Alph.SourceSelection
	  */
	 LanguageTool.prototype.findSelection = function(a_ro, a_rngstr)
	 {
	     alert("No selection method defined");
	     return {};
	 };
	 
	 /**
	  * Sets the lexiconLookup method for the instance of the class.
	  * This is derived according to the language-specific configuration.
	  * @see #lexiconLookup
	  * @private
	  */
	 LanguageTool.prototype.setLexiconLookup = function()
	 {
	     var lexicon_method =
	    	 this.getModule().config().methods_lexicon;
	     
	     if (lexicon_method == 'webservice')
	     {        
	         
	         /**
	          * @ignore
	          */
	         this.lexiconLookup = function(a_alphtarget,a_onsuccess,a_onerror)
	         {
	             logger.info("Query word: " + a_alphtarget.getWord());

	             var url = this.getModule().config().url_lexicon;
	             // override local daemon per main prefs
	             if (utils.isLocalUrl(url) && this.getModule().config().morphservice_remote)
	             {
	            	 url = this.getModule().config().morphservice_remote_url;
	              
	             }
	             url = url + this.getModule().config().url_lexicon_request;
	             url = url.replace(/\<WORD\>/,
	                                   encodeURIComponent(a_alphtarget.getWord()));
	             // TODO add support for the context in the lexicon url

	     
	             $.ajax(
	                 {
	                     type: "GET",
	                     url: url,
	                     timeout: this.getModule().config().url_lexicon_timeout,
	                     dataType: 'html', //TODO - get from prefs
	                     error: function(req,textStatus,errorThrown)
	                     {
	                         a_onerror(textStatus||errorThrown);
	                     },
	                     success: function(data, textStatus)
	                         { a_onsuccess(data); }
	                    }
	             );
	         }
	         
	     }
	     else if (typeof this[lexicon_method] == 'function')
	     {
	         this.lexiconLookup = this[lexicon_method];
	     }
	     else
	     {
	         logger.debug("methods.lexicon invalid or undefined: " + lexicon_method);
	     }
	 }

	 /**
	  * Looks up the target selection in the lexicon tool
	  * @param {Alph.SourceSelection} a_alphtarget the target selection object (as returned by findSelection)
	  * @param {function} a_onsuccess callback upon successful lookup.
	  *                               Takes the lexicon output as an argument.
	  * @param {function} a_onerror callback upon successful lookup.
	  *                             Takes an error message as argument.
	  */
	 LanguageTool.prototype.lexiconLookup = function(a_alphtarget,a_onsuccess,a_onerror)
	 {
	     a_onerror(strings.getString("error_nolexicon",this.d_sourceLanguage));
	 };
	 
	 /**
	  * Set the contextHandler method for the instance of the class.
	  * This is derived according to the language-specific configuration.
	  * @see #contextHandler
	  * @private
	  */
	 LanguageTool.prototype.setContextHandler = function()
	 {
	     var context_handler =
	    	 this.getModule().config().context_handler;
	     if (typeof this[context_handler] == 'function')
	     {
	         this.contextHandler = this[context_handler];
	     }
	     else
	     {
	         logger.info("No context_handler defined for " + this.d_sourceLanguage);
	     }

	 }


	 /**
	  * Method which can be used to add language-specific
	  * handler(s) to the body of the popup
	  * @param {Document} a_doc the content document for the window
	  * TODO - does this really need to be the whole document
	  *        or just the popup?
	  */
	 LanguageTool.prototype.contextHandler = function(a_doc)
	 {
	     // default is to do nothing
	     return;
	 };

	 /**
	  * Set the shiftHandler method for the instance of the class.
	  * This is derived according to the language-specific configuration.
	  * @see #shiftHandler
	  * @private
	  */
	 LanguageTool.prototype.setShiftHandler = function()
	 {
	     var shift_handler =
	    	 this.getModule().config().shift_handler;
	     if (typeof this[shift_handler] == 'function')
	     {
	         this.shiftHandler = this[shift_handler];
	     }
	     else
	     {
	         logger.debug("No shift_handler defined for " + this.d_sourceLanguage);
	     }
	 }
	 /**
	  * Method which can be used to add a handler for the shift key
	  * TODO - this should really be a generic keypress handler
	  * @param {Event} a_event the keypress event
	  * @param {Node} a_node the target node
	  */
	 LanguageTool.prototype.shiftHandler = function(a_event,a_node)
	 {
	     // default is to do nothing
	     return;
	 };

	 /**
	  * Helper method for {@link #findSelection} which
	  * identifies target word and surrounding
	  * context for languages whose words are
	  * space-separated
	  * @see #findSelection
	  * @private
	  */
	 LanguageTool.prototype.doSpaceSeparatedWordSelection =
	 function(a_ro, a_rngstr)
	 {

	     var result = new SourceSelection();

	     // clean string:
	     //   convert punctuation to spaces
	     a_rngstr =
	       a_rngstr.replace(new RegExp("[" + this.getPunctuation() + "]","g")," ");        
	     logger.debug("In doSpaceSeparatedWordSelection for " + a_rngstr);

	     // If the user selected whitespace in the margins of a range
	     // just return.
	     if (this.selectionInMargin(a_ro, a_rngstr))
	     {
	         // return for mouseover whitespace
	         return result;
	     }

	     // skip back to end of previous word
	     while ((a_ro > 0) && (a_rngstr[--a_ro] == ' '));

	     // remove leading white space
	     var nonWS = a_rngstr.search(/\S/);
	     a_rngstr = a_rngstr.substr(nonWS).replace(/(\r|\n)/, " ");
	     a_ro -= nonWS;

	     // find word
	     var wordStart = a_rngstr.lastIndexOf(" ", a_ro) + 1;
	     var wordEnd = a_rngstr.indexOf(" ", a_ro);

	     if (wordEnd == -1)
	         wordEnd = a_rngstr.length;


	     // if empty, nothing to do
	     if (wordStart == wordEnd)
	     {
	         return result;
	     }

	     //extract word
	     var word = a_rngstr.substring(wordStart,wordEnd);


	     /* Identify the words preceeding and following the focus word
	      * TODO - if the content is marked up, and the word is the only
	      * word in the parent of the rangeParent text node, we should
	      * traverse the DOM tree to pull in the surrounding context.
	      *
	      * We also need to be able to pull surrounding context for text
	      * nodes that are broken up by formatting tags (<br/> etc))
	      */
	     var context_forward = this.getContextForward();
	     var context_back = this.getContextBack();

	     var context_str = null;
	     var context_pos = 0;

	     if (context_forward || context_back) {
	         var startstr = a_rngstr.substring(0, wordEnd);
	         var endstr = a_rngstr.substring(wordEnd+1, a_rngstr.length);
	         var pre_wordlist = startstr.split(/\s+/);
	         var post_wordlist = endstr.split(/\s+/);

	         // limit to the requested # of context words
	         // prior to the selected word
	         // the selected word is the last item in the
	         // pre_wordlist array
	         if (pre_wordlist.length > context_back + 1) {
	             pre_wordlist =
	             pre_wordlist.slice(pre_wordlist.length-(context_back + 1));
	         }
	         // limit to the requested # of context words
	         // following to the selected word
	         if (post_wordlist.length > context_forward)
	         {
	             post_wordlist = post_wordlist.slice(0, context_forward);
	         }

	         /* TODO: should we put the punctuation back in to the
	         * surrounding context? Might be necessary for syntax parsing.
	         */
	         context_str =
	             pre_wordlist.join(" ") + " " + post_wordlist.join(" ");
	         context_pos = pre_wordlist.length - 1;
	     }

	     result.setWord(word);
	     result.setWordStart(nonWS + wordStart);
	     result.setWordEnd(nonWS + wordEnd);
	     result.setContext(context_str);
	     result.setContextPos(context_pos);
	     return result;
	 };

	 /**
	  * Helper method for {@link #findSelection} which identifies
	  * target word and surrounding context for languages
	  * whose words are character based
	  * @see #findSelection
	  * @private
	  */
	 LanguageTool.prototype.doCharacterBasedWordSelection =
	 function(a_ro, a_rngstr)
	 {
	     var result = new SourceSelection();

	     // clean string:
	     //   convert punctuation to spaces
	     a_rngstr.replace(new RegExp("[" + this.getPunctuation() + "]","g")," ");

	     // If the user selected whitespace in the margins of a range
	     // just return.
	     if (this.selectionInMargin(a_ro, a_rngstr))
	     {
	         // return for mouseover whitespace
	         return result;
	     }

	     // remove leading white space
	     var nonWS = a_rngstr.search(/\S/);
	     a_rngstr = a_rngstr.substr(nonWS).replace(/(\r|\n)/, " ");
	     a_ro -= nonWS;

	     // TODO - handle spaces between characters

	     // find word
	     var wordStart = a_ro;
	     var wordEnd = a_ro;
	     //a_rngstr.indexOf(" ", a_ro);

	     //if (wordEnd == -1)
	     //    wordEnd = a_rngstr.length;


	     // if empty, nothing to do
	     //if (wordStart == wordEnd)
	     //{
	     //    return result;
	     //}

	     //extract word
	     var word = a_rngstr.charAt(a_ro);


	     /* Identify the words preceeding and following the focus word
	      * TODO - if the content is marked up, and the word is the only
	      * word in the parent of the rangeParent text node, we should
	      * traverse the DOM tree to pull in the surrounding context.
	      *
	      * We also need to be able to pull surrounding context for text
	      * nodes that are broken up by formatting tags (<br/> etc))
	      */
	     var context_forward = this.getContextForward();
	     var context_back = this.getContextBack();

	     var context_str = null;
	     var context_pos = 0;

	     if (context_forward || context_back) {
	         var startstr = a_rngstr.substring(0, wordEnd);
	         var next_space = a_rngstr.indexOf(" ", a_ro);

	        var endstr;
	        if ( next_space != -1 &&
	             context_forward > 0 &&
	             (next_space-a_ro) < context_forward)
	        {
	             endstr = a_rngstr.substring(wordEnd+1,next_space)
	         }
	         else
	         {
	             endstr = a_rngstr.substr(wordEnd+1, context_forward);
	         }

	         context_str = word + endstr;
	         context_pos = 0;
	     }
	     result.setWord(word);
	     result.setWordStart(nonWS + wordStart);
	     result.setWordEnd(nonWS + wordEnd);
	     result.setContext(context_str);
	     result.setContextPos(context_pos);
	     return result;
	 }

	 /**
	  * Generic method to apply any necessary conversion
	  * to the source text selection.
	  * Delegates to a language-specific
	  * conversion method.
	  * @private
	  * @param {Alph.SourceSelection} a_alphtarget the object returned by {@link #findSelection}
	  */
	 LanguageTool.prototype.handleConversion = function(a_alphtarget)
	 {
	     var self = this;
	     var convert_method =
	    	 this.getModule().config().methods_convert;

	     if (convert_method != null
	         && typeof this.d_converter[convert_method] == 'function'
	         && a_alphtarget.getWord())
	     {
	         a_alphtarget.convertWord( function(a_word) { return self.d_converter[convert_method](a_word); } );
	     }

	     return a_alphtarget;
	 };

	 LanguageTool.prototype.convertString = function(a_str)
	 {
	   var convert_method =
		   this.getModule().config().methods_convert;

	     if (convert_method != null
	         && typeof this.d_converter[convert_method] == 'function')
	     {
	         a_str = this.d_converter[convert_method](a_str);
	     }
	     return a_str;
	 }


	 /**
	  * Handler which can be used as the contextHander.
	  * It uses language-specific configuration to identify
	  * the elements from the alph-text popup which should produce links
	  * to the language-specific grammar.
	  * @see #contextHandler
	  */
	 LanguageTool.prototype.grammarContext = function(a_doc)
	 {
	     var myobj=this;
	     var links = this.getGrammarLinks();

	     for (var link_name in links)
	     {
	         if (links.hasOwnProperty(link_name))
	         {
	             $(".alph-entry ." + link_name,a_doc).bind('click',link_name,
	                 function(a_e)
	                 {
	                       // build target inside grammar
	                       var target = a_e.data;
	                       var rngContext = $(this).attr("context");
	                       if (rngContext != null)
	                       {
	                         target += "-" + rngContext.split(/-/)[0];
	                       }
	                       myobj.openGrammar(a_e.originaEvent,this,target);
	                 }
	             );
	         }
	     }
	 };

	 /**
	  * Open the Grammar defined for the language.
	  * @param {Event} a_event the event which triggered the request
	  * @param {Node} a_node the DOM node to show a loading message next to (optional)
	  * @param {String} a_target a string to be added to the Grammar url (replacing the <ITEM> placeholder (optional)
	  * @param {Object} a_params parameters object to pass to the Grammar window (optional)
	  */
	 LanguageTool.prototype.openGrammar = function(a_event,a_node,a_target,a_params)
	 {
	     var thisObj = this;
	     var targetURL = this.getModule().config().url_grammar || "";
	     targetURL = targetURL.replace(/\<ITEM\>/, a_target || "");

	     var grammar_loading_msg = strings.getString("loading_grammar");
	     var features =
	     {
	         screen: this.getModule().config().grammar_window_loc
	     };

	     // TODO - list of parameters to pass should come from
	     // preferences
	     var params = $.extend(
	         {
	             target_href: a_target,
	             callback: a_node ? 
	                       function() { xlate.hideLoadingMessage(a_node.ownerDocument) }
	                       : function() {},
	             lang_tool: thisObj
	         },
	         a_params || {}
	     );
	     // open or replace the grammar window
	     xlate.openSecondaryWindow(
	         "alph-grammar-window",
	         targetURL,
	         features,
	         params,
	         xlate.showLoadingMessage,
	             [a_node||{},grammar_loading_msg]
	     );
	 };

	 /**
	  * Default Diagram window - assumes treebank diagram url points at a fully
	  * functional external treebank editor and which specifies any required parameters
	  * with placeholders for the dynamically selected SENTENCE and WORD.
	  * @param {Event} a_event the event which triggered the request
	  * @param {String} a_title the window title
	  * @param {Node} a_node the DOM node to show a loading message next to (optional)
	  * @param {Object} a_params parameters object to pass to the window (optional)
	  */
	 LanguageTool.prototype.openDiagram = function(a_event,a_title,a_node,a_params)
	 {
	     var thisObj = this;   
	     if (! a_title)
	     {
	         // translation panel and source document diagrams should open in separate windows
	         if (translation.getBrowser($(a_node).get(0).ownerDocument))
	         {
	             a_title = 'alph-trans-diagram-window';   
	         } 
	         else
	         {
	             a_title = 'alph-diagram-window';
	         }
	     }
	     
	     var features = {};

	     var window_url = this.getModule().config().contenturl + "/diagram/alpheios-diagram.xul";
	     var params = $.extend(
	         {
	             e_callback: a_node ? 
	                       function() { xlate.hideLoadingMessage(a_node.ownerDocument) }
	                       : function() {},
	             e_langTool: thisObj,
	             e_srcDoc: a_node ? a_node.ownerDocument : null,
	             e_proxiedEvent: thisObj.getPopupTrigger(),
	             e_proxiedHandler: main.doXlateText,
	             // TODO HTML5 implement data manager
	             //e_dataManager : Alph.DataManager,
	             e_dataManager: null,
	             e_viewer: true,
	             e_metadata: { 'alpheios-getSentenceURL': window_url,
	                         'alpheios-putSentenceURL': window_url }            
	         },
	         a_params || {}
	     );
	             

	     var loading_node = $("#alph-word-tools",a_node).get(0);    
	     if (a_node && ! params.e_url)
	     {
	    	 // TODO HTML5 implement Site
	         //var treebankUrl = Alph.Site.getTreebankDiagramUrl(a_node.ownerDocument);
	    	 var treebankUrl = null;
	         var tbrefs = a_params.tbrefs;
	         var sentence;
	         var word;
	         if (treebankUrl && tbrefs)
	         {
	             try
	             {
	                 // just use the first reference as the focus if there are multiple
	                 var allrefs = tbrefs.split(' ');
	                 var parts = allrefs[0].split(/-/);
	                 sentence = parts[0];
	                 word = parts[1];
	             }
	             catch(a_e)
	             {
	                 main.s_logger.error("Error identifying sentence and id: " + a_e);                   
	             }
	         }
	         if (sentence)
	         {
	             treebankUrl = treebankUrl.replace(/SENTENCE/, sentence);
	             treebankUrl = treebankUrl.replace(/WORD/, word);
	             params.e_url = treebankUrl;
	         }
	     }
	     
	     if (params.e_url)
	     {
	         // open or replace the diagram window
	         xlate.openSecondaryWindow(
	             a_title,
	             window_url,            
	             features,
	             params,
	             xlate.showLoadingMessage,
	                 [loading_node||{}, strings.getString("loading_misc")]                
	         );
	     }
	     else
	     {
	         logger.warn("No tree url");
	         butils.doAlert(window,"alph-general-dialog-title","alph-error-tree-notree");
	     }
	 };

	 /**
	  * Handler which can be used to show context-specific inflection tables
	  * @param {Event} a_event the target event
	  * @param {Object} a_otherparams option object to supply default parameters
	  * @param {Node} a_node the node which contains the context
	  */
	 LanguageTool.prototype.handleInflections = function(a_event,a_node,a_otherparams)
	 {

	     var params = a_otherparams || {};

	     // if we weren't explicitly handled a node to work with, try to find the popup
	     // in the default content document
	     if (! a_node)
	     {
	         a_node = $("#alph-text", xlate.getLastDoc()).clone();
	     }
	     if ($(a_node).length != 0)
	     {
	             params = this.getInflectionTable(a_node,params);
	     }

	     if (typeof params.showpofs == 'undefined')
	     {
	         params.xml_url =
	        	 this.getModule().config().contenturl
	             + "/inflections/alph-infl-index.xml";
	         params.xslt_processor = butils.getXsltProcessor('alph-infl-index.xsl');
	     }
	     params.source_node = a_node;

	     // give the inflections window a reference to this language tool
	     params.lang_tool = this;

	     if (params.query_mode)
	     {
	         params.xslt_params.e_showOnlyMatches = true;
	     }
	     logger.debug("Handling inflections for " + params.showpofs);

	     // send the word endings to the declension table
	     // if the window isn't already open, open it
	     // TODO window features should be language-specific
	     var features =
	     {
	         width:"300",
	         height:"620",
	         screen: prefs.get("shift_window_loc")
	     }
	     // add a callback to hide the loading message
	     var loading_msg = strings.getString("loading_inflect");

	     var loading_node;
	     if ($(a_node).length >0)
	     {
	         /**
	          * @ignore
	          */
	         params.callback = function() { xlate.hideLoadingMessage($(a_node).get(0).ownerDocument) };
	         loading_node = $("#alph-word-tools",a_node).get(0);
	     }
	     else
	     {
	         /**
	          * @ignore
	          */
	         params.callback = function() {};
	         loading_node = {};
	     }
	      
	     xlate.openSecondaryWindow(
	                     "alph-infl-table",
	                     prefs.get('contenturl') + "/infl/alpheios-infl.xul",
	                     features,
	                     params,
	                     xlate.showLoadingMessage,[loading_node,loading_msg]
	     );
	     logger.info("Inflections window should have focus with "
	             + main.getStateObj().getVar("word"));
	 }

	 /**
	  * Handler which can be used to show context-specific inflection tables
	  * for the morpohology panel
	  * @param {Event} a_event the target event
	  * @param {Node} a_node the node which contains the context
	  */
	 LanguageTool.prototype.handleInflectionsForMorphWindow = function(a_event,a_node)
	 {
	     var morph_doc = $("#alph-morph-body").get(0).contentDocument;
	     var morph_text = $("#alph-text",morph_doc);
	     this.handleInflections(a_event,morph_text);
	 }

	 /**
	  * Check to see if this language tool can produce an inflection table display
	  * for the current node
	  */
	 LanguageTool.prototype.canInflect = function(a_node)
	 {
	     var params = this.getInflectionTable(a_node,{},true);
	     return (typeof params.showpofs == 'string');
	 }

	 /**
	  * Helper function to determine if the user's selection
	  * is in the margin of the document
	  * @private
	  * @param {int} a_ro the range offset for the selection
	  * @param {String} a_rngstr the enclosing string
	  * @returns true if in the margin, false if not
	  * @type Boolean
	  */
	 LanguageTool.prototype.selectionInMargin = function(a_ro, a_rngstr)
	 {
	     // Sometimes mouseover a margin seems to set the range offset
	     // greater than the string length, so check that condition,
	     // as well as looking for whitepace at the offset with
	     // only whitespace to the right or left of the offset
	     var inMargin =
	         a_ro >= a_rngstr.length ||
	         ( a_rngstr[a_ro].indexOf(" ") == 0 &&
	             (a_rngstr.slice(0,a_ro).search(/\S/) == -1 ||
	              a_rngstr.slice(a_ro+1,-1).search(/\S/) == -1)
	         );
	     return inMargin;
	 };

	 /**
	  * Adds the language specific stylesheet to the window
	  * content document, to apply to the display of the popup
	  * @param {Document} a_doc the window content document
	  * @param {String} a_name name of the stylesheet
	  *                        (optional - if not specified package
	  *                        name will be used)
	  */
	 LanguageTool.prototype.addStyleSheet = function(a_doc,a_name)
	 {
	     var pkgname = this.getPkgName();
	     var css_url = prefs.get('styleurl',this.d_sourceLanguage);
	     if (typeof a_name == "undefined")
	     {
	         a_name = pkgname;
	     }
	     css_url = css_url + '/' + a_name + ".css"
	     
	     // only add the stylesheet if it's not already there
	     if ($("link[href='"+ css_url + "']",a_doc).length == 0)
	     {
	         logger.debug("adding stylesheet: " + css_url);
	         var css = a_doc.createElementNS(
	             "http://www.w3.org/1999/xhtml","link");
	         css.setAttribute("rel", "stylesheet");
	         css.setAttribute("type", "text/css");
	         css.setAttribute("href", css_url);
	         css.setAttribute("id", a_name + "-css");
	         css.setAttribute("class","alpheios-lang-css");
	         $("head",a_doc).append(css);
	     }
	 };

	 /**
	  * Removes the language specific stylesheet
	  *  from the window content document.
	  * @param {Document} a_doc the window content document
	  * @param {String} a_name name of the stylesheet
	  *                       (optional - if not specified package
	  *                       name will be used)
	  */
	 LanguageTool.prototype.removeStyleSheet = function(a_doc,a_name)
	 {
	     var pkgname = this.getPkgName();
	     var css_url = prefs.get('styleurl',this.d_sourceLanguage);
	     if (typeof a_name == "undefined")
	     {
	         a_name = pkgname;
	     }
	     css_url = css_url + '/' + a_name + ".css"
	     $("link[href='"+css_url + "']",a_doc).remove();
	 };

	 /**
	  * Method which can be used to apply post-transformation
	  * changes to the transformed lexicon output
	  * @param {Node} a_node the HTML DOM node containing the lexicon output
	  */
	 LanguageTool.prototype.postTransform = function(a_node)
	 {
	     // no default behavior
	 };

	 /**
	  * Method which should be used to retrieve the path to
	  * the correct parameters for the inflection window given the
	  * properties of the target word.
	  * @param {Node} a_node the node containing the target word
	  * @param {String} a_params optional requested parameters
	  * @param {Boolean} a_skipload optional flag to indicate the xslt load should be skipped
	  * @returns the parameters object for the inflection window
	  */
	 LanguageTool.prototype.getInflectionTable = function(a_node, a_params, a_checkonly)
	 {
	     // no default behavior
	     return;
	 };

	 /**
	  * Method which checks the availability of a specific feature
	  * @param {String} a_id the id of the feature
	  * @returns {Boolean} true if enabled, otherwise false
	  */
	 LanguageTool.prototype.getFeature = function(a_id)
	 {
	     var enabled = prefs.get("features_"+a_id,this.d_sourceLanguage);
	     logger.debug("Feature " + a_id + " for " + this.d_sourceLanguage + " is " + enabled);
	     return enabled;
	 };

	 /**
	  * Method which returns the requested command
	  * @param {String} a_cmd the name of the command
	  * @returns {String} the name of the function associated with the command
	  *                  or undefined.
	  */
	 LanguageTool.prototype.getCmd = function(a_cmd)
	 {
	     return prefs.get("cmds_"+a_cmd,this.d_sourceLanguage);
	 };

	 /**
	  * Method returns a language-specific file from the index_files directory
	  * of the language chrome.
	  * Temporary until we figure out how we really want to handle this
	  * @param {String} a_docid The id (name) of the file to retrieve
	  */
	 LanguageTool.prototype.getIndexFile = function(a_docid)
	 {
	     return prefs.get('contenturl',this.d_sourceLanguage) + "/index_files/" + a_docid;
	 };

	 /**
	  * Method which applies language-specific post-processing to the
	  * inflection table display
	  * @param {Element} a_tbl the inflection table DOM element
	  */
	 LanguageTool.prototype.handleInflectionDisplay = function(a_tbl)
	 {
	   // default does nothing
	 };

	 /**
	  * Check to see if one or more full dictionaries are available
	  * @returns true if a dictionary is available, false if not
	  * @type Boolean
	  */
	 LanguageTool.prototype.hasDictionary = function()
	 {
	     // if no dictionary is defined for the language, return null
	     var has_dict = false;
	     var codeList;
	     try 
	     {
	         codeList = prefs.get("dictionaries_full",this.d_sourceLanguage).split(/,/);
	     }
	     catch(a_e){
	         // the preference might not be defined
	         codeList = [];
	     }
	     
	     var remote_disabled = prefs.get("disable_remote");
	     for (var i=0; i<codeList.length; i++)
	     {
	         var code = codeList[i];
	         // if a dictionary wasn't setup properly
	         // disable the dictionary feature
	         if (typeof this.d_lexiconSearch[code] == 'undefined')
	         {
	             has_dict = false;
	             break;
	         }
	         // if remote features are disabled and any of  the dictionaries 
	         // uses a remote url, disable the dictionary feature
	         else if ( remote_disabled &&  
	                   ! utils.isLocalUrl(this.d_lexiconSearch[code].url)
	                 )
	          {
	             has_dict = false;
	             break;        
	          }
	          // otherwise dictionary was setup so feature is enabled
	          else
	          {
	             has_dict = true;  
	          }    
	     }
	     return has_dict;
	 }

	 /**
	  * Get the browse url of the current dictionary
	  * @param {String} a_dict the requested dictionary (use default if null)
	  * @param {Node} a_entry the dictionary entry node 
	  * @param {Boolean} a_browseRoot flag to browse to a specific root entry
	  * @returns the browse url of the dictionary or null if none defined
	  * @type String
	  */
	 LanguageTool.prototype.getDictionaryBrowseUrl = function(a_dict,a_entry,a_browseRoot)
	 {
	     var browse_url = null;
	     var dict = a_dict;
	     if (dict == null)
	     {
	     	dict = this.getDictionary();
	     }    
	     if (dict != null)
	     {
	 		var body_key = $(a_entry).attr("body-key");
	 		var key_url =prefs.get(
	                 "dictionary_full_" + dict + "_browse_url_" + body_key,
	                 this.d_sourceLanguage);
	 		if (body_key && key_url)
	 		{
	 			browse_url = key_url;
	 		}
	 		else
	 		{
	 			browse_url =
	 	            prefs.get(
	 	                "dictionary_full_" + dict + "_browse_url",
	 	                this.d_sourceLanguage);	
	 		}    	    	
	     	if (a_browseRoot && $(a_entry).attr("root"))
	     	{    		    		
	     		var root_param = prefs.get(
	                     "dictionary_full_" + dict + "_browse_root_param",
	                     this.d_sourceLanguage);
	     		if (root_param != null)
	     		{      	                
	     			var cvt = 
	     				prefs.get("dictionary_full." + dict
	     						+ ".browse_convert_method", this.d_sourceLanguage);
	     			var root_term = $(a_entry).attr("root");
	     			if (cvt != null
	     				        && typeof this.d_converter[cvt] == 'function')                
	                 {
	                     root_term = this.d_converter[cvt](root_term);
	     			}
	     			root_param = root_param.replace(/\<ROOT\>/, encodeURIComponent(root_term));
	     			browse_url = browse_url + root_param; 
	     		}
	     	}
	     	 
	     }    
	     return browse_url;
	 }

	 /**
	  * Get html for a link to the current dictionary
	  * @returns html to add to an element to produce a link to the dictionary
	  * @type String
	  */
	 LanguageTool.prototype.getDictionaryLink = function()
	 {
	     var link = '';
	     if (this.hasDictionary())
	     {
	         var dict_alt_text = strings.getString("dictionary_link");
	         link = '<div class="alph-tool-icon alpheios-button alph-dict-link" ' +
	                'href="#alph-dict" title="' + dict_alt_text + '">' +
	                '<img src="' + prefs.get('styleurl') + '/icons/wordlist_16.png" ' +
	                'alt="' + dict_alt_text + '"/>' + 
	                '<div class="alpheios-icon-label">' + dict_alt_text + '</div></div>';
	     }
	     return link;
	 }

	 /**
	  * Returns a callback to the current dictionary for the language
	  * which can be used to populate a display with HTML including a full
	  * definition for a lemma or list of lemmas. The HTML produced by the lookup
	  * method should include a separate div for each lemma, with an attribute named
	  * 'lemma' set to the name of the lemma.
	  * @returns {function} a function which accepts the following parameters:
	  *                      {String} a_dict_name dictionary_name,
	  *                      {Array}  a_lemmas list of lemmas
	  *                      {function} a_success callback function for successful lookup
	  *                      {function} a_error callback function for error
	  *                      {function} a_complete callback function upon completion
	  * @returns {Object} null if no default dictionary is defined for the language
	  */
	 LanguageTool.prototype.getDictionaryCallback = function()
	 {
	     // if we have a specific method defined for producing
	     // the dictionary urls for this dictionary, then use it
	     // otherwise use the default method
	     var dict_method = null;
	     if (this.hasDictionary())
	     {
	         dict_method =
	             prefs.get(
	                 "methods_dictionary_full_default",
	                 this.d_sourceLanguage);
	     }

	     var lang_obj = this;
	     var dict_callback =
	         function(a_lemmas,a_success,a_error,a_complete)
	         {
	             lang_obj[dict_method](a_lemmas,a_success,a_error,a_complete);
	         };

	     return dict_callback;
	 }

	 /**
	  * Default dictionary lookup method to call a webservice.
	  * The url for the webservice is expected to be defined in the language-specific
	  * preference setting: url.dictionary.full.<dict_name> and the name of a url parameter
	  * to set to the lemma in url.dictionary.full.dict_name.lemma_param. If the setting
	  * methods.dictionary.full.default.multiple_lemmas_allowed is true, then a single
	  * request  will be issued for all lemmas, otherwise, separate requests for
	  * each lemma.
	  * @param {Array} a_lemmas the list of lemmas to be looked up
	  * @param {function} a_success callback to be executed upon successful lookup
	  * @param {function} a_error callback to be executed upon error
	  * @param {function} a_complete callback to be executed upon completion
	  */
	 LanguageTool.prototype.defaultDictionaryLookup =
	     function(a_lemmas, a_success, a_error, a_complete)
	 {
	     var lang_obj = this;
	     var lastLemma = -1;

	     // see if we can add any ids
	     a_lemmas.forEach(
	         function(a_lemma, a_i)
	         {
	             // if no id found yet
	             if (!a_lemma[0])
	             {
	                 // try to find id
	                 var lemma_id = lang_obj.getLemmaId(a_lemma[1]);
	                 a_lemma[0] = lemma_id[0];
	                 a_lemma[3] = lemma_id[1];
	                 if (a_lemma[0])
	                 {
	                     logger.debug("found id " + a_lemma[0] +
	                                   " for lemma " + a_lemma[1] +
	                                   " in " + a_lemma[3]);
	                 }
	             }

	             // convert any lemma that has no id
	             if (!a_lemma[0] && a_lemma[1] && a_lemma[3])
	             {
	                 // if conversion method specified, apply it
	                 var cvt = lang_obj.d_lexiconSearch[a_lemma[3]]["convert"];
	                 if (cvt)
	                     a_lemma[1] = convert[cvt](a_lemma[1]);
	             }

	             // remember last lemma with a lexicon
	             if (a_lemma[3])
	                 lastLemma = a_i;
	         });
	     // TODO: What if no language is specified?
	     // Should we handle multiple languages?

	     // remove any trailing unusable lemmas and check for empty set
	     a_lemmas.splice(lastLemma + 1, a_lemmas.length - (lastLemma + 1));
	     if (a_lemmas.length == 0)
	     {
	         // call error and completion routines
	         a_error("No results found", "");
	         a_complete();
	         return;
	     }

	     // for each lemma
	     var url = null;
	     a_lemmas.forEach(
	         function(a_lemma, a_i)
	         {
	             var code = a_lemma[3];
	             if (!code)
	                 return;

	             // build URL with id if available else lemma
	             if (!url)
	             {
	                 url = lang_obj.d_lexiconSearch[code]["url"];
	                 url = url.replace(/\<LEXICON\>/, encodeURIComponent(code));
	             }
	             if (a_lemma[0] && lang_obj.d_lexiconSearch[code]["id"])
	             {
	                 // Note: Not correct for lexicons not supporting
	                 // multiple values.

	                 // for each id
	                 var ids = a_lemma[0].split(',');
	                 for (var i = 0; i < ids.length; i++)
	                 {
	                     // add search for id
	                     url += "&" +
	                            lang_obj.d_lexiconSearch[code]["id"] +
	                            "=" +
	                            encodeURIComponent(ids[i]);
	                 }
	             }
	             else if (a_lemma[1] && lang_obj.d_lexiconSearch[code]["lemma"])
	             {
	                 // add search for lemma
	                 url += "&" +
	                        lang_obj.d_lexiconSearch[code]["lemma"] +
	                        "=" +
	                        encodeURIComponent(a_lemma[1]);
	             }

	             // if lexicon does not support multiple values
	             // or we need to submit multi-valued URL
	             // (because lexicon is about to change or this is last lemma)
	             if (!lang_obj.d_lexiconSearch[code]["multiple"] ||
	                 (a_i == (a_lemmas.length - 1)) ||
	                 (code != a_lemmas[a_i + 1][3]))
	             {
	                 // build success method
	                 var on_success;
	                 var xform_method =
	                         lang_obj.d_lexiconSearch[code]["transform"];
	                 if (xform_method != null)
	                 {
	                     on_success =
	                         function(a_html, a_dict_name)
	                         {
	                             lang_obj.s_logger.debug("calling " + xform_method);
	                             a_html = lang_obj[xform_method](a_html);
	                             a_success(a_html, a_dict_name);
	                         }
	                 }
	                 else
	                 {
	                     on_success = a_success;
	                 }

	                 // call dictionary
	                 // but only use real completion for last item
	                 logger.debug("Calling dictionary at " + url);
	                 lang_obj.doSecondaryDictionaryLookup(
	                     code,
	                     url,
	                     on_success,
	                     a_error,
	                     (a_i < (a_lemmas.length - 1)) ? function(){} : a_complete);

	                 // start a new URL for next lemma
	                 url = null;
	             }
	         });
	 };

	 /**
	  * Helper method which calls the dictionary webservice
	  * @param {String} a_dict_name the dictionary name
	  * @param {String} a_url the url to GET
	  * @param {function} a_callback callback upon successful lookup
	  * @param {function} a_error callback upon error
	  * @param {function} a_complete callback upon completion
	  */
	 LanguageTool.prototype.doDefaultDictionaryLookup =
	     function(a_dict_name,a_url,a_success,a_error,a_complete)
	 {
	     $.ajax(
	         {
	             type: "GET",
	             url: a_url,
	             dataType: 'html',
	             timeout: prefs.get("methods_dictionary_full_default_timeout",
	                                         this.d_sourceLanguage),
	             error: function(req,textStatus,errorThrown)
	             {
	                 a_error(textStatus||errorThrown,a_dict_name);

	             },
	             success: function(data, textStatus)
	             {
	                 var lemma_html;
	                 // TODO This is a hack. We should really create a DOM from
	                 // the response and use that to extract the body contents
	                 // but for some reason I can't get that to work with jQuery.
	                 // For now, just using string matching to pull whatever is in
	                 // the body out, or if no body tags are present, use the
	                 // string as is.
	                 var body_start = data.match(/(<body\s*(.*?)>)/i);
	                 var body_end =data.match(/<\/body>/i);
	                 var lemma_html;
	                 if (body_start && body_end)
	                 {
	                     var body_tag_length = body_start[1].length;
	                     lemma_html = data.substring(body_start.index+body_tag_length+1,body_end.index);
	                 }
	                 else
	                 {
	                     lemma_html = data;
	                 }
	                 a_success(lemma_html,a_dict_name);
	             },
	             complete: a_complete
	         }
	     );
	 };
	 
	 /**
	  * Helper method which calls the dictionary webservice
	  * @param {String} a_dict_name the dictionary name
	  * @param {String} a_url the url to GET
	  * @param {function} a_callback callback upon successful lookup
	  * @param {function} a_error callback upon error
	  * @param {function} a_complete callback upon completion
	  */
	 LanguageTool.prototype.doSecondaryDictionaryLookup =
	     function(a_dict_name,a_url,a_success,a_error,a_complete)
	 {
         var features =
	     {
	         screen: this.getModule().config().grammar_window_loc
	     };
         var loading_node = $("#alph-word-tools").get(0);
         var loading_msg = strings.getString("loading_dictionary");
         var params = $.extend(
    	         {
    	             callback: loading_node ? 
    	                       function() { xlate.hideLoadingMessage(loading_node.ownerDocument) }
    	                       : function() {},
    	             lang_tool: this
    	         },
    	         {}
    	     );
         xlate.openSecondaryWindow(
        		 "alph-dictionary-window",
        		 a_url,
        		 features,
        		 params,
        		 null,
        		 null,
        		 xlate.hideLoadingMessage);
	 };
	 
	 

	 /**
	  * language-specific method to handle runtime changes to language-specific
	  * preferences
	  * @param {String} a_name the name of the preference which changed
	  * @param {Object} a_value the new value of the preference
	  */
	 LanguageTool.prototype.observePrefChange = function(a_name,a_value)
	 {
	     // default does nothing
	 };

	 /**
	  * Get the unique id for a lemma from a dictionary index file
	  * @param {String} a_lemma_key the lemma key
	  * @returns {Array} (lemma id, dict code) or (null, null) if not found
	  */
	 LanguageTool.prototype.getLemmaId = function(a_lemma_key)
	 {
	     //default returns null
	     return Array(null, null);
	 };

	 /**
	  * Get a language-specific string property
	  * @param {String} a_name the name of the property
	  * @param {Array} a_replace Optional list of replacement strings
	  * @returns the requested string (or empty string if not found)
	  * @type String
	  */
	 LanguageTool.prototype.getString = function(a_name,a_replace)
	 {

		 return strings.getLanguageString(this.d_sourceLanguage,a_name,a_replace);
	 }

	 /**
	  * Get a language specific string, or the default string for all languages
	  * @param {String} a_name the name of the property
	  * @param {Array} a_replace Optional list of replacement strings
	  * @returns the requested string (or empty string if not found)
	  * @type String
	 */
	 LanguageTool.prototype.getStringOrDefault = function(a_name,a_replace)
	 {
	     var str = this.getString(a_name,a_replace);
	     if (str == '')
	     {
	         str = strings.getString(a_name,a_replace);
	     }
	     return str;
	 }

	 /**
	  * Add the language-specific tools to the word lookup
	  * @paramaters {Node} a_node the node which contains the results
	  *                              of the word lookup
	  * @params {Alph.SourceSelection} a_target the target element of the user's selection
	  */
	 LanguageTool.prototype.addWordTools = function(a_node, a_target)
	 {
	     var lang_tool = this;

	     var icon_url = prefs.get('styleurl') + '/icons/'; 
	     var tools_node = $("#alph-word-tools",a_node);
	     if (prefs.get('smallicons'))
	     {
	         $(tools_node).addClass("smallicons");
	     }
	     // add diagram link, if appropriate (only add if we have a treebank reference
	     // and we're not already on the tree
	     if (a_target.getTreebankRef() &&
	    		 //TODO HTML5 Site impl.
//	         Alph.Site.getTreebankDiagramUrl($(a_node).get(0).ownerDocument) &&
	    		 false &&
	         $("#dependency-tree",$(a_node).get(0).ownerDocument).length == 0)
	     {
	         var diagram_alt_text = strings.getString("diagram_link");
	         $('' +
	             '<div class="alph-tool-icon alpheios-button alph-diagram-link" ' +
	             'href="#alpheios-diagram" title="' + diagram_alt_text + '">'+
	             '<img src="' + icon_url + 'diagram_16.png"' +
	             ' alt="' + diagram_alt_text + '" />' + 
	             '<div class="alpheios-icon-label">' + diagram_alt_text + '</div></div>',a_node)
	             .appendTo(tools_node);
	         var diagram_func;
	         var diagram_cmd = lang_tool.getCmd('alpheios-diagram-cmd');
	         // for version > 0 of treebank metadatum, use treebank diagramming command
	         // defined per language (defaults to external treebank editor)
	         if (diagram_cmd &&
	        		 
	        		 // TODO HTML5 Site impl
	             //Alph.Site.getMetadataVersion("alpheios-treebank-diagram-url",
	             //    $(a_node).get(0).ownerDocument) > 0
	        		 false)
	         {   
	             diagram_func = function(a_e)
	             {
	                 xlate.showLoadingMessage([tools_node,strings.getString("loading_misc")]);
	                 lang_tool[diagram_cmd](a_e,null,$(a_node).get(0),{tbrefs:a_target.getTreebankRef()});
	                 return false;
	             }
	         }
	         else
	         {
	             // early alpha versions used the internal tree panel implementation
	             // TODO remove this once all enhanced texts have been updated to version > 0 of the
	             // treebank metadatum
	             diagram_func = function(a_e)
	             {                 
	                 $("#alpheios-tree-open-cmd").get(0).doCommand(a_e);
	                 return false;
	             }
	         }
	         $('#alph-word-tools .alph-diagram-link',a_node).click(diagram_func);
	     }
	     // add language-specific dictionary link, if any
	     var lemmas = [];
	     $(".alph-dict",a_node).each(
	         function()
	         {
	             var lemma_key = this.getAttribute("lemma-key"); 
	             if ( lemma_key )
	             {
	                 lemmas.push([lemma_key,this.getAttribute("lemma-lex")]);
	             }
	         }
	     );
	     if (lemmas.length > 0)
	     {
	         $("#alph-word-tools",a_node).append(this.getDictionaryLink());
	         // TODO the dictionary handler should be defined in Alph.Dict
	         // rather than here. also doesn't work from a detached window yet.
	         $('#alph-word-tools .alph-dict-link',a_node).click(
	             function(a_event)
	             {
	            	 //TODO HTML5 events
	                 //main.broadcastUiEvent(constants.EVENTS.SHOW_DICT,{src_node: $(a_node).get(0)});
	            	// get a callback to the current dictionary
	         	    var dictionary_callback = lang_tool.getDictionaryCallback();
	         	    
	         	    var src_doc = $(a_node).get(0).ownerDocument; 
	         	    
	         	    var alph_window = $("#alph-window",src_doc).get(0);

	         	    // remove any prior dictionary entries or loading messages
	         	    // from the lexicon display
	         	    $(".loading",alph_window).remove();
	         	    $(".alph-dict-block",alph_window).remove();


	         	    // pull the new lemmas out of the alph-window lexicon element
	         	    var lemmas = [];
	         	    $(".alph-dict",alph_window).each(
	         	        function()
	         	        {
	         	            var lemma = this.getAttribute("lemma-key");
	         	            var lemma_id = this.getAttribute("lemma-id");
	         	            var lemma_lang = this.getAttribute("lemma-lang");
	         	            var lemma_lex = this.getAttribute("lemma-lex");
	         	            if (lemma || lemma_id)
	         	            {
	         	                // lemma may have multiple values, so split
	         	                var lemset = lemma.split(' ');
	         	                for (var i in lemset)
	         	                    lemmas.push([lemma_id, lemset[i], lemma_lang, lemma_lex]);
	         	            }
	         	        }
	         	    );

	         	    // don't do anything other than updating the state
	         	    // if we don't have any lemmas
	         	    if (lemmas.length > 0)
	         	    {
	         	        if (typeof dictionary_callback != 'function')
	         	        {
	         	            // if we don't have any callback defined for this language,
	         	            // just display the short definition in the alph-window
	         	            $(alph_window).addClass("default-dict-display");
	         	            $(alph_window).removeClass("full-dict-display");
	         	            // remove any dictionary-specific stylesheets and
	         	            // remove the dictionary name from the state
	         	            if (panel_state.dicts[bro_id] != null)
	         	            {
	         	                language_tool.removeStyleSheet(dict_doc,
	         	                    'alpheios-dict-' + panel_state.dicts[bro_id]);
	         	                panel_state.dicts[bro_id] = null;
	         	            }
	         	            logger.warn("No dictionary defined " + dictionary_callback);
	         	        }
	         	        else
	         	        {
	         	            // we have a dictionary callback method, so pass the lemmas
	         	            // to the callback to get the dictionary html.
	         	            // Also pass references to callback methods which
	         	            // will populate the panel obj with the dictionary output

	         	            // but first add a loading message
	         	            var lemma_list = $.map(lemmas,function(a){return a[1]}).join(', ');
	         	            var request_id = (new Date()).getTime()
	         	                + encodeURIComponent(lemma_list)
	         	            $("#alph-window").append(
	         	                    '<div id="alph-secondary-loading" class="loading" ' +
	         	                        'alph-request-id="' + request_id + '">'
	         	                    + strings.getString("searching_dictionary",[lemma_list])
	         	                    + "</div>");
	         	            dictionary_callback(lemmas,function(){},function(){},function(){})

	         	        }
	         	    }
	             }
	         );
	     }

	     // add the inflection tool, if any
	     if (this.getFeature('alpheios-inflect') && this.canInflect(a_node))
	     {
	         var inflect_alt_text = strings.getString("inflect_link");
	         $("#alph-word-tools",a_node).append(
	             '<div class="alph-tool-icon alpheios-button alph-inflect-link" ' +
	             'href="#alpheios-inflect" title="' + inflect_alt_text + '">' +
	             '<img src="' + icon_url + 'inflection_16.png" ' +
	             'alt="' + inflect_alt_text + '"/>' + 
	             '<div class="alpheios-icon-label">' + inflect_alt_text + '</div></div>'
	         );

	         $('#alph-word-tools .alph-inflect-link',a_node).click(
	             function(a_e)
	             {
	                 xlate.showLoadingMessage([tools_node,strings.getString("loading_inflect")]);
	                 lang_tool.handleInflections(a_e,a_node);
	                 return false;
	             }
	         );
	     }
	     
	     if (this.getFeature('alpheios-speech') 
	         && prefs.get("url_speech",this.d_sourceLanguage)
	         // Currently speech function piggy backs on morphservice.remote setting because
	         // espeak is called through mhttpd and must be enabled only if mhttpd is
	         && !(prefs.get("morphservice_remote")))
	     {
	         var alt_text = strings.getString("speech_link");
	         var link = $(
	             '<div class="alph-tool-icon alpheios-button alph-speech-link" ' +
	             'href="#alpheios-speech" title="' + alt_text + '">' +
	             '<img src="chrome://alpheios/skin/icons/speech_16.png" ' +
	             'alt="' + alt_text + '"/>' + 
	             '<div class="alpheios-icon-label">' + alt_text + '</div></div>',a_node
	         );
	         link.click(
	             function(a_e)
	             {
	                 xlate.showLoadingMessage([tools_node,strings.getString("loading_speech")]);
	                 lang_tool.handleSpeech(a_e,a_node);
	                 return false;
	             }
	         );
	         $("#alph-word-tools",a_node).append(link);
	     }
	     
	     var wordlist = lang_tool.getWordList();     
	     if (wordlist && 
	         lemmas.length > 0 &&
	         // hide the learned button on the wordlist display
	         $("#alpheios-wordlist",$(a_node).get(0).ownerDocument).length == 0)       
	     {
	         var normalizedWord = lang_tool.normalizeWord(a_target.getWord());        
	         var alt_text = strings.getString("mywords_link");
	         var added_msg = strings.getString("mywords_added",normalizedWord);
	         var link = $(  
	             '<div class="alph-tool-icon alpheios-button alph-mywords-link" ' +
	             'href="#alpheios-mywords" title="' + alt_text + '">' +
	             '<img src="chrome://alpheios/skin/icons/vocablist_16.png" ' +
	             'alt="' + alt_text + '"/>' + 
	             '<div class="alpheios-icon-label">' + alt_text + '</div></div>',a_node
	         );
	         $(link).click(
	             function(a_e)
	             {
	                 if (butils.doConfirm(window,added_msg))
	                 {
	                     lang_tool.addToWordList(a_node,true,true);
	                     // TODO HTML5 Site impl
	                     //Alph.Site.toggleWordStatus(
	                     //        lang_tool,$(a_node).get(0).ownerDocument,normalizedWord);
	                 }
	                 return false;
	             }
	         );
	         $("#alph-word-tools",a_node).append(link);
	     }

	     if ($("#alph-word-tools",a_node).children().length > 0)
	     {
	         if ($("#alph-word-tools",a_node).prepend(
	             '<span class="alpheios-toolbar-label">' + strings.getString("tools")
	             + '</span>')
	         );
	     }
	 }

	 /**
	  * Copy the tools for the Quiz window from the original source node,
	  * replacing the click handlers with ones which first make sure the
	  * correct tab is current in the browser window, because some of the
	  * tools require that the current browser tab be the same as the one which
	  * did the lookup in the first place
	  * @param {Node} a_node the source node which produced the query display
	  * @returns {Element} the Element containing the tools 
	  */
	 LanguageTool.prototype.getToolsForQuery = function(a_node)
	 {
	     var lang_tool = this;    
	     var tools = $("#alph-word-tools",a_node).clone();
	     // hide the learned button in the quiz for now
	     // TODO word should be automatically identified as learned or not according to user's answer
	     $('.alph-mywords-link',tools).remove();
	     var from_tree = $("#dependency-tree",$(a_node).get(0).ownerDocument).length > 0;
	     $('.alph-diagram-link',tools).click(
	         function(a_e)
	         {
	        	 // TODO HTML5 browser tab functionality
	             //if (Alph.BrowserUtils.selectBrowserForDoc(window,a_node.ownerDocument))
	        	 if (false)
	             {
	                 // just pass the diagram click back to the originating node to handle
	                 $(".alph-diagram-link",a_node).click();
	             }
	             else
	             {
	                 alert("Unable to locate source browser");
	             }
	             return false;
	         }
	     );
	     // if the node is from the dependency tree diagram, the call to selectBrowserForDoc
	     // will fail, in which case we should just try to pass the click back to the originating node     
	     $('.alph-inflect-link',tools).click(
	         function(a_e)
	         {
	        	 // TODO HTML5 browser tab functionality
	             //if ( Alph.BrowserUtils.selectBrowserForDoc(window,a_node.ownerDocument))
	        	 if (false)
	             {
	                 xlate.showLoadingMessage([tools,strings.getString("loading_inflect")]);
	                 lang_tool.handleInflections(a_e,a_node);
	             }
	             else if (from_tree)
	             {
	                 $(".alph-inflect-link",a_node).click();
	             }
	             else {
	                 alert("Unable to locate source browser");
	             }
	             return false;
	         }
	     );
	     $('.alph-dict-link',tools).click(
	         function(a_event)
	         {
	        	 // TODO HTML5 browser tab functionality
	             //if (Alph.BrowserUtils.selectBrowserForDoc(window,$(a_node).get(0).ownerDocument))
	        	 if (false)
	             {
	        		 // TODO HTML5 events
	                 //main.broadcastUiEvent(
	                 //    constants.EVENTS.SHOW_DICT,{src_node: $(a_node).get(0)});
	             }
	             else if (from_tree)
	             {
	                 $(".alph-dict-link",a_node).click();
	             }
	             else
	             {
	                 alert("Unable to locate source browser");
	             }
	             return false;
	         }
	     );
	     $(".alph-speech-link",tools).click(
	         function(a_e)
	         {
	        	 // TODO HTML5 browser tab functionality
	             //if ( Alph.BrowserUtils.selectBrowserForDoc(window,$(a_node).get(0).ownerDocument))
	        	 if (false)
	             {                
	                 xlate.showLoadingMessage([tools,strings.getString("loading_speech")]);
	                 lang_tool.handleSpeech(a_e,a_node);
	             }
	             else if (from_tree)
	             {
	                 $(".alph-speech-link",a_node).click();
	             }
	             else {
	                 alert("Unable to locate source browser");
	             }
	             return false;
	         }
	     );
	     return tools;
	 }

	 /**
	  * Add language-specific help links to the inflections component of the
	  * word lookup output (if any)
	  * @paramaters {Node} a_node the node which contains the results
	  *                              of the word lookup
	  * @params {Alph.SourceSelection} a_target the target element of the user's selection
	 */
	 LanguageTool.prototype.addInflHelp = function(a_node, a_target)
	 {
	     var form = strings.getString("morph_form");
	     var stem = strings.getString("morph_stem");
	     var suffix = strings.getString("morph_suffix");
	     var prefix = strings.getString("morph_prefix");
	     var icon_url = prefs.get('styleurl') + '/icons/';
	     $(".alph-term",a_node).each(
	         function()
	         {
	             var suff_elem = $('.alph-suff',this);
	             var pref_elem = $('.alph-pref',this);
	             var message = (suff_elem.length == 0 || suff_elem.text() == '')
	                 ?  form : stem + "+" + suffix;
	             if (pref_elem.length != 0 || pref_elem.text() != '')
	             {
	                 message = prefix + "+" + message;
	             }
	             
	             
	             var help_node = $('<span class="alph-form-end"/>',a_node);
	             help_node.append($('<span class="alph-help-link"><img src="' + icon_url + 'information-16.png" alt="Info" /></span>',
	                 a_node).hover(
	                    function()
	                    {
	                        $(this).after(
	                            '<span class="alph-tooltip">' + message + '</span>');
	                    },
	                    function()
	                    {
	                        $(this).next('.alph-tooltip').remove();
	                    }
	                 )
	             );
	             $(this).after(help_node);
	         }
	     );

	     $(".alph-infl",a_node).each(
	         function()
	         {

	             var atts = [];
	             $("span",this).each(
	                 function()
	                 {
	                     var title;
	                     var class_list = $(this).attr("class");
	                     if ( class_list && (title = class_list.match(/alph-(\w+)/)))
	                     {
	                         var name;
	                         try
	                         {
	                             if ($(this).nextAll(".alph-"+title[1]).length > 0)
	                             {
	                                 name =
	                                     strings.getString("morph_" +title[1] + '-plural');
	                             }
	                             else
	                             {
	                                 name =
	                                     strings.getString("alph-morph-" +title[1]);
	                             }
	                             // only display attributes for which we have explicitly
	                             // defined strings, and which we haven't already added
	                             if (name && $(this).prevAll(".alph-"+title[1]).length == 0)
	                             {
	                                 atts.push(name);
	                             }
	                         }
	                         catch(a_e)
	                         {
	                             // quietly ignore missing strings
	                         }

	                     }
	                 }
	             );
	             if (atts.length > 0)
	             {
	                 var message = atts.join(',');
	                 $(this).append(
	                     '<span class="alph-infl-end"><span class="alph-help-link">' + 
	                     '<img src="' + icon_url + 'information-16.png" alt="Info" /></span></span>');

	                 $('.alph-help-link',this).hover(
	                     function()
	                     {
	                         $(this).after(
	                             '<span class="alph-tooltip">' + message + '</span>');
	                     },
	                     function()
	                     {
	                         $(this).next('.alph-tooltip').remove();
	                     }
	                 );
	             }
	         }
	     );
	 }

	 /**
	  * Match a single inflection with only one set of attribute values
	  * against an inflection which may contain multiple possible attribute values
	  * @param {Element} a_match_infl the .alph-infl element to match (single-valued) 
	  * @param {Element} a_infls the .alph-infl element to match against (multi-valued)
	  */
	 LanguageTool.prototype.matchInfl = function(a_match_infl, a_infls)
	 {
	     var must_match = 0;
	     var matched = 0;
	     var atts = ['num','gend','tense','voice','pers','mood','case'];
	     atts.forEach(
	         function(a_att)
	         {
	             var match_val;
	             match_val = $('.alph-'+ a_att,a_match_infl).attr('context') ||
	                     $('.alph-'+ a_att,a_match_infl).text();
	             var possible = $('.alph-'+ a_att,a_infls);
	             // only check those attributes which are defined in the inflection
	             // we want to match
	             if (match_val)
	             {
	                 must_match++;
	                 var found_match = false;
	                 // iterate through the values found for this attribute
	                 // in the element we're matching against and if at least
	                 // one instance matches, return a positive match
	                 for (var i=0; i<possible.length; i++)
	                 {
	                     var poss_val = $(possible[i]).attr('context') || $(possible[i]).text();
	                     if (match_val == poss_val)
	                     {
	                        found_match = true;
	                        break;
	                     }
	                 }
	                 // if at least one matching value for this attribute
	                 // was found, increase the matched count
	                 if (found_match)
	                 {
	                     matched++;
	                 }
	             }
	         }
	     );
	     return (matched == must_match);
	 }

	 /**
	  * Get the string to be used in the interface for this language
	  * @returns the string to be used in the interface for this language
	  * @type String
	  */
	 LanguageTool.prototype.getLanguageString = function()
	 {
	     var str = this.getString(this.d_sourceLanguage + '.string');
	     if (str == '')
	     {
	         str = this.d_sourceLanguage;
	     }
	     return str;
	 }

	 /**
	  * Check to see if the supplied language code is supported by this tool
	  * @param {String} a_code the language code
	  * @returns true if supported false if not
	  * @type Boolean
	  */
	 LanguageTool.prototype.supportsLanguage = function(a_lang)
	 {
	     var supported = false;
	     try
	     {
	         var codes = prefs.get("languagecode",this.d_sourceLanguage).split(',');  
	         for (var i=0; i<codes.length; i++)
	         {
	             if (a_lang == codes[i])
	             {
	                 supported = true;
	                 break;
	             }
	         }
	     }
	     catch(a_e)
	     {
	         logger.warn("No language codes registered for " + this.d_sourceLanguage);
	         supported = false;
	     }
	     return supported;
	 };

	 LanguageTool.prototype.handleSpeech= function(a_event,a_node)
	 {
	     var lang_obj = this;
	     var form = $(".alph-word",a_node).attr("context");
	     logger.debug("Speak word: " + form);
	     var url = prefs.get("url_speech",this.d_sourceLanguage);
	     url = url.replace(/\<WORD\>/,encodeURIComponent(form));
	     // send asynchronous request to the speech service
	     logger.debug("Speech url " + url);
	     $.ajax(
	     {
	         type: "GET",
	         url: url,
	         timeout: prefs.get("url_speech_timeout",lang_obj.d_sourceLanguage),
	         error: function(req,textStatus,errorThrown)
	         {
	             xlate.hideLoadingMessage($(a_node).get(0).ownerDocument);
	         },
	         success: function(data, textStatus)
	         { xlate.hideLoadingMessage($(a_node).get(0).ownerDocument); }
	     });
	 };

	 /**
	  * Return a normalized version of a word which can be used to compare the word for equality
	  * @param {String} a_word the source word
	  * @returns the normalized form of the word (default version just returns the same word, 
	  *          override in language-specific subclass)
	  * @type String
	  */
	 LanguageTool.prototype.normalizeWord = function(a_word)
	 {
	     return a_word;
	 }


	 /**
	  * Get the user's wordlist for the language
	  * @returns the wordlist, or null if user features aren't enabled
	  * @type Alph.DataType (WordList implementation)
	  */
	 LanguageTool.prototype.getWordList = function()
	 {
		 // TODO HTML5 implement data manager
	     //return (Alph.DataManager.getDataObj('words',this.d_sourceLanguage,true));
	 };

	 /**
	  * Add add a looked up word to the wordlist for the language
	  * @param {Node} a_node the node containing the lookup results
	  * @param {Boolean} a_learned flag to indicate if the user 
	  *                            has learned the word
	  * @param {Boolean} a_userAction flag to indicate if the request was automatic (false)
	  *                               or user-initiated (true)                             
	  */
	 LanguageTool.prototype.addToWordList = function(a_node,a_learned,a_userAction)
	 {
	     var self = this;
	     var wordlist = self.getWordList();
	     if (!wordlist)
	     {
	         // don't do anything if we have no wordlist
	         return;
	     }
	         
	     var seenLemmas = new Array();
	     var updated = false;
	     $(".alph-word .alph-dict",a_node).each(
	         function()
	         {
	             var lemma_key = this.getAttribute("lemma-key"); 
	             if ( lemma_key )
	             {
	                 
	                 // TODO compose a real CTS urn for the dictionary entry
	                 var urn = lemma_key + ':' + this.getAttribute("lemma-lex");                
	                 // remove special flags and trailing digits from lemmas
	                 var lemma = lemma_key.replace(/^@/,'');
	                 lemma = lemma.replace(/\d+$/,'');
	                 lemma = self.normalizeWord(lemma);
	                 if (! seenLemmas[lemma])
	                 {
	                     seenLemmas[lemma] = true;
	                     var normalizedWord =
	                         self.normalizeWord($(this).parents(".alph-word").attr("context"));                                            
	                     wordlist.updateFormEntry(
	                         window,
	                         self.getLanguageCode(),
	                         normalizedWord,
	                         lemma,
	                         urn,
	                         a_learned,
	                         a_userAction);
	                     updated = true;
	                 }
	             }        
	         }
	     );
	     if (updated)
	     {
	    	 // TODO HTML5 events
	         //main.broadcastUiEvent(constants.EVENTS.VOCAB_UPDATE, { src_node: $(a_node).get(0) });        
	     }
	 };

	 /**
	  * Get a list of valid puncutation for this language
	  * @returns {String} a string containing valid puncutation symbols
	  */
	 LanguageTool.prototype.getPunctuation = function()
	 {
	     return ".,;:!?'\"(){}\\[\\]<>\/\\\u00A0\u2010\u2011\u2012\u2013\u2014\u2015\u2018\u2019\u201C\u201D\u0387\u00B7\n\r";        
	 };
	 
	 LanguageTool.prototype.getPref = function(a_name)
	 {
		 return prefs.get(a_name);
	 };
	 
	 LanguageTool.prototype.getModule = function()
		{
			return module;
		};

	 return(LanguageTool);
});