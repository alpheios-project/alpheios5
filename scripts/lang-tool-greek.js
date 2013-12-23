/**
 * @fileoverview Greek extension of Alph.LanguageTool class
 * @version $Id: alpheios-greek-langtool.js 2781 2010-03-31 18:52:15Z MichaelGursky $
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
 *
 * Morpheus is from Perseus Digital Library http://www.perseus.tufts.edu
 * and is licensed under the Mozilla Public License 1.1.
 * You should have received a copy of the MPL 1.1
 * along with this program. If not, see http://www.mozilla.org/MPL/MPL-1.1.html.
 *
 * The Smyth Grammar and LSJ Meanings come from the Perseus Digital Library
 * They are licensed under Creative Commons NonCommercial ShareAlike 3.0
 * License http://creativecommons.org/licenses/by-nc-sa/3.0/us
 */
 
define(['jquery','lang-tool','convert-greek','lang-tool-factory','prefs','logger','browser-utils','datafile','convert-greek','module'], 
		function($,LanguageTool,converter,factory,prefs,logger,butils,Datafile,ConvertGreek,module) {

	LanguageToolFactory.addLang('greek','LanguageTool_Greek');
	
	/**
	 * @class  Greek implementation of {@link Alph.LanguageTool}
	 * @extends Alph.LanguageTool
	 * @param {String} a_language  the source language for this instance
	 * @param {Properties} a_properties additional properties to set as private members of
	 *                                  the object (accessor methods will be dynamically created)
	 */
	LanguageTool_Greek = function(a_lang, props)
	{
	    LanguageTool.call(this,a_lang,{});
	};
	
	/**
	 * @ignore
	 */
	LanguageTool_Greek.prototype = new LanguageTool();
	
	/**
	 * Greek-specific startup method in the derived instance which
	 * loads the dictionary files. Called by the derived instance
	 * keyed by the preference setting 'extensions.alpheios.greek.methods.startup'.
	 * @returns true if successful, otherwise false
	 * @type boolean
	 */
	LanguageTool_Greek.prototype.loadShortDefs = function()
	{
	    this.d_defsFile = Array();
	    this.d_shortLexCode = this.getPref("dictionaries_short").split(',');
	
	    for (var i = 0; i < this.d_shortLexCode.length; ++i)
	    {
	        // load the local short definitions dictionary data file
	        var lex = this.d_shortLexCode[i];
	        try
	        {
	            this.d_defsFile[i] =
	                new Datafile(
	                        this.getPref('contenturl') + '/dictionaries/' +
	                        lex +
	                        "/grc-" +
	                        lex +
	                        "-defs.dat",
	                        "UTF-8",
	                        function() {
	                        	logger.info("Loaded Greek defs for " + lex);
	                        });
	            
	
	        }
	        catch (ex)
	        {
	            alert("error loading definitions: " + ex);
	            return false;
	        }
	    }
	    return true;
	};
	
	/**
	 * Greek-specific startup method in the derived instance which
	 * xslt for stripping the unicode. Called by the derived instance
	 * keyed by the preference setting 'extensions.alpheios.greek.methods.startup'.
	 * @returns true if successful, otherwise false
	 * @type boolean
	 */
	LanguageTool_Greek.prototype.loadStripper = function()
	{
	    try
	    {
	        this.d_stripper = butils.getXsltProcessor('alpheios-unistrip.xsl');
	    }
	    catch (ex)
	    {
	        alert("error loading xslt alpheios-unistrip.xsl: " + ex);
	        return false;
	    }
	
	    return true;
	};
	
	/**
	 * loads the Greek-specific converter object
	 * @see Alph.LanguageTool#loadConverter
	 */
	LanguageTool_Greek.prototype.loadConverter = function()
	{
	    this.d_converter = new ConvertGreek();  
	};
	
	
	/**
	 *  Mapping table which maps the part of speech or mood
	 *  to the key name for producing the inflection table
	 *  Format is:
	 *      pofs or mood: { keys: [array of inflectable table keys]
	 *                      links: [array of other links] }
	 * @static
	 * @private
	 */
	LanguageTool_Greek.INFLECTION_MAP =
	{     noun: { keys: ['noun'], links: [] },
	      adjective: {keys: ['adjective'], links:[] },
	      adjective_simplified: {keys: ['adjective_simplified'], links:[] },
	      noun_simplified: {keys: ['noun_simplified'], links:[] },
	      pronoun: { keys: ['pronoun'],links:[] },
	      irregular: { keys: ['pronoun_interrogative'],links:[] },
	      article: { keys: ['article'],links:[] },
	      numeral: { keys: ['numeral'],links:[] },
	      verb: { keys: ['verb'],links:['verb_all'] },
	      verb_participle: { keys: ['verb_participle'],links:['verb_all'] },
	      verb_all: { keys: ['verb_all'],links:['verb'] },
	      adverb: {keys: ['adverb'],links:[]}
	};
	
	LanguageTool_Greek.IRREG_VERBS =
	[
	];
	
	/**
	 * lookup table for pronouns
	 * array of pronoun types and the constraints for matching
	 * [0] = pronoun type abbreviation 
	 *       (matches suffix on the inflection table xml file alph-infl-pronoun-<type>.xml)
	 * [1] = Array of possible lemmas for this pronoun type
	 * [2] = Optional morpheus stemtype value restriction (when lemma alone isn't enough)
	 * @static
	 * @private
	 */
	LanguageTool_Greek.PRONOUNS =
	[
	    ['dem',['ὅδε','οὗτος','ἐκεῖνος']],
	    ['rel',['@ὅς','ὅς']],// there's a special flag on lemma for ὅς
	    ['genrel',['ὅστις']],
	    ['pers',['ἐγώ','σύ','ἕ']],
	    ['indef',['τις']],
	    ['inter',['τίς']],
	    ['inten',['αὐτός']],
	    ['recip',['ἀλλήλων']],
	    ['refl',['ἐμαυτοῦ','σαυτοῦ','ἑαυτοῦ','σφεῖς']],
	    ['pos',['ἐμός','ἡμέτερος','σός','ὑ̄μέτερος','ὅς','σφέτερος'],['pronoun_pos1','pronoun_pos2','pronoun_pos3']],
	    ['pos1',['ἐμός','ἡμέτερος']],
	    ['pos2',['σός','ὑ̄μέτερος']],
	    ['pos3',['ὅς','σφέτερος']]
	];
	
	/**
	 * Greek-specific implementation of {@link Alph.LanguageTool#getInflectionTable}.
	 * @param {Node} a_node the node containing the target word
	 * @param {String} a_params optional requested parameters
	 * @param {Boolean} a_checkonly flag to indicate xslt load should be skipped
	 * @returns the parameters object for the inflection window
	 */
	LanguageTool_Greek.prototype.getInflectionTable = function(a_node, a_params, a_checkonly)
	{
	    var langObj = this;
	    
	    var params = a_params || {};
	
	    // initialize the suffix arrays
	    // TODO should flip this to be a single object keys on infl_type
	    params.entries = {};
	    // clear out the links
	    params.links = [];
	
	    var form = $(".alph-word",a_node).attr("context");
	
	    for (var infl_type in LanguageTool_Greek.INFLECTION_MAP )
	    {
	        var key = LanguageTool_Greek.INFLECTION_MAP[infl_type].keys[0];
	        params.entries[key] = [];
	    }
	
	    // The word will have one more more alph-infl-set elements
	    // Each alph-infl-set element should have a alph-suffix element
	    // and one or more alph-infl elements.  Iterate through the alph-infl-sets
	    // retrieving the alph-suffix elements which are applicable to
	    // each supported part of speech
	    $(".alph-infl-set",a_node).each(
	        function(i)
	        {
	            var dict = $(this).siblings(".alph-dict");
	            var word = $(this).attr("context");
	            var stemtype = $(".alph-stemtype",this).attr("context");
	            var lemma = $(dict).attr("lemma-key");
	
	            // check for the pofs first as a child of this element, and if not present,
	            // then from the sibling dictionary entry
	            var my_pofs;
	            var infl_pofs = $(".alph-pofs",this);
	            if (infl_pofs.length == 0)
	            {
	                infl_pofs = $(".alph-pofs",dict)
	            }
	
	            // check for irregular verbs
	
	            langObj.s_logger.debug("lemma for inflection set: " + lemma);
	
	            var irregular = false;
	            for (var i=0; i< LanguageTool_Greek.IRREG_VERBS.length; i++)
	            {
	                if (lemma == LanguageTool_Greek.IRREG_VERBS[i])
	                {
	                    // reset the context
	                    params.hdwd = lemma;
	                    irregular = true;
	                    break;
	                }
	            }
	
	            var infls = {};
	
	            // gather the moods for the verbs
	            // TODO - look at handling multiple cases separately for the nouns and adjectives?
	            $(".alph-infl",this).each(
	                function()
	                {
	                    // some verb moods (infinitive, imperative and gerundive) link to
	                    // a supplemental table rather than primary verb pofs table
	
	                    var mood = $(".alph-mood",this).attr('context');
	                    if (LanguageTool_Greek.INFLECTION_MAP[mood])
	                    {
	                        infls[LanguageTool_Greek.INFLECTION_MAP[mood].keys[0]] = $(this).get(0);
	                    }
	                }
	            );
	            if (irregular)
	            {
	                infls[LanguageTool_Greek.INFLECTION_MAP['verb_irregular'].keys[0]] = $(this).get(0);
	            }
	            for (var pofs in LanguageTool_Greek.INFLECTION_MAP)
	            {
	                var map_pofs = LanguageTool_Greek.INFLECTION_MAP[pofs].keys[0];
	
	
	                var check_pofs = pofs.replace(/_simplified$/,'');
	                // if we couldn't find the part of speech or the part of speech
	                // isn't one we support then just move on to the next part of speech
	                if ( infl_pofs.length == 0 ||
	                     $(infl_pofs[0]).attr("context") != check_pofs)
	                {
	                    continue;
	                }
	
	                // make sure we look at at least the first inflection from
	                // this inflection set. If we need to look at multiple inflections they
	                // will already have been identified above.
	                // this will also add in a general verb inflection for those verbs which use a supplemental table
	                if (! infls[map_pofs] )
	                {
	                    infls[map_pofs] = $(".alph-infl",this).get(0)
	                }
	
	                for (var infl_type in infls)
	                {
	
	                    // if a particular pofs wasn't requested
	                    // and this is the first pofs processed, set it
	                    // as the default
	                    if (typeof params.showpofs == 'undefined')
	                    {
	                        params.showpofs = infl_type;
	                    }
	
	                    params.entries[infl_type].push(
	                        $(this).parent(".alph-entry").get(0));
	
	                    // identify the correct file and links for the inflection type
	                    // being displayed
	                    if (params.showpofs == infl_type)
	                    {
	                        params.links = LanguageTool_Greek.INFLECTION_MAP[pofs].links;
	                    
	
	                        // if it's a pronoun, what type?
	                        if (infl_type.match(/^pronoun/))
	                        {
	                             params.type = '';
	                             for (var i=0; i< LanguageTool_Greek.PRONOUNS.length; i++)
	                             {
	                                var pronoun_list = LanguageTool_Greek.PRONOUNS[i];
	                                var type = pronoun_list[0];
	                                for (var j=0; j < pronoun_list[1].length; j++)
	                                {
	
	                                    if (lemma == pronoun_list[1][j])
	                                    {
	                                        // if there is an additional stemtype restriction
	                                        // make sure it matches
	                                        if (typeof pronoun_list[2] == "undefined" 
	                                            || (stemtype == pronoun_list[2]))
	                                        {
	                                            if (params.type == '')                                            {
	                                                params.type = type;
	                                            }
	                                            else if (params.type != type)
	                                            {
	                                                // TODO handling multiple pronoun
	                                                // types for a single lemma isn't
	                                                // implemented 
	                                            }
	                                        }
	                                        break;
	                                    }
	                                }
	                            }
	                            langObj.s_logger.debug("Pronoun type="+params.type);
	                        } // end pronoun identification
	                    }
	                } // end infl-type
	            }
	        }
	    );
	    // identify the correct xslt parameters for the requested inflection type
	    if (params.showpofs && ! a_checkonly)
	    {
	        params.content_url = this.getPref('contenturl');
	        params.html_url = 
	            params.content_url + "/html/alph-infl-substantive.html";
	        LanguageTool_Greek.setInflectionXSL(params,params.showpofs,form);
	        
	        // TODO -remove this HACK which suppresses the Javascript matching algorithm
	        //params.suppress_match = true;
	        params.always_expand = true;
	    }
	    return params;
	};
	
	/**
	 * Helper method to set the XML/XSLT params for the inflection table
	 * @param {String} a_params the other params for the window
	 * @param {String} a_infl_type the inflection type
	 */
	LanguageTool_Greek.setInflectionXSL = function(a_params,a_infl_type,a_form)
	{
	    a_params.xslt_params = {};
	    a_params.xslt_params.e_fragment = 1;
	    a_params.xslt_params.e_selectedEndings = a_params.entries[a_infl_type];
	    a_params.xslt_params.e_form = a_form || "";
	    a_params.xslt_params.e_normalizeGreek = true;
	
	    var html_url = a_params.content_url + '/html/';
	    var xml_url = a_params.content_url + '/inflections/';
	
	    // get rid of the selected endings parameter if we couldn't find any
	    if (typeof a_params.xslt_params.e_selectedEndings == "undefined" ||
	         a_params.xslt_params.e_selectedEndings.length == 0)
	    {
	        delete a_params.xslt_params.e_selectedEndings;
	    }
	
	    if (a_infl_type.match(/^verb/))
	    {
	        a_params.xml_url = xml_url + 'alph-infl-verb-paradigms.xml';
	        a_params.xslt_processor = butils.getXsltProcessor('alph-infl-paradigm.xsl');
	        if (a_infl_type.match(/_all$/))
	        {
	            a_params.xslt_params.e_paradigmId = 'all';
	            a_params.xslt_params.e_matchPofs = 'verb';
	            a_params.xslt_params.e_selectedEndings = 
	                a_params.entries.verb.concat(a_params.entries.verb_participle);
	        }
	        else if (typeof a_params.paradigm_id != 'undefined' && a_params.paradigm_id != null)
	        {
	            a_params.xslt_params.e_paradigmId = a_params.paradigm_id;
	        }
	        a_params.html_url = html_url + "alph-infl-verb-paradigms.html";
	        a_params.title = 'alph-infl-title-verb-paradigms';
	        a_params.xslt_params.e_normalizeGreek = false;
	    }
	    else if (a_infl_type == 'article')
	    {
	        a_params.xml_url = xml_url + 'alph-infl-' + a_infl_type + '.xml';
	        a_params.xslt_processor = butils.getXsltProcessor('alph-infl-single-grouping.xsl');
	        a_params.xslt_params.e_group4 = 'gend';
	        a_params.xslt_params.e_matchForm = true;
	    }
	    else if (a_infl_type.match(/^pronoun/))
	    {
	        a_params.title = 'alph-infl-title-pronoun-' + a_params.type;
	        // morpheus specifies 'irregular' as the part of speech for the interrogative pronoun
	        if (a_infl_type.match(/_interrogative$/))
	        {
	            a_params.xslt_params.e_matchPofs = 'irregular';
	            a_infl_type = a_infl_type.replace(/_interrogative$/,'');
	        }
	        a_params.xml_url = xml_url + 'alph-infl-'+ a_infl_type + '-' + a_params.type + '.xml';
	        // pronoun tables contain full forms
	        a_params.xslt_params.e_matchForm = true;
	        
	        if (a_params.type == 'dem')
	        {
	            a_params.xslt_processor = butils.getXsltProcessor('alph-infl-substantive.xsl');
	            a_params.xslt_params.e_group4 = 'hdwd';
	        }
	        else if (a_params.type == 'refl' || a_params.type.match(/^pos/))
	        {
	            a_params.xslt_processor = butils.getXsltProcessor('alph-infl-substantive.xsl');
	            a_params.xslt_params.e_group4 = 'pers';
	            if (a_params.type.match(/^pos/))
	            {
	                a_params.xslt_params.e_group1 = 'objnum';
	            }
	        }
	        else if (a_params.type != '')
	        {
	            a_params.xslt_processor = butils.getXsltProcessor('alph-infl-single-grouping.xsl');
	            if (a_params.type == 'pers')
	            {
	                a_params.xslt_params.e_group4 = 'pers';
	            }
	            else
	            {
	                a_params.xslt_params.e_group4 = 'gend';
	            }
	        }
	        else
	        {
	            // if we don't have a specific mapping for this type of pronoun, just
	            // present a link to Smyth's Pronouns
	            a_params.xml_url = null;
	            a_params.xml_obj =
	                (new DOMParser()).parseFromString("<infl-data/>","text/xml");
	            a_params.xslt_processor = butils.getXsltProcessor('alph-infl-substantive.xsl');
	            a_params.xslt_params.e_linkContent="grammar:smyth:s325|See Smyth Sections 325-340 Pronouns"
	        }
	    }
	    else if (a_infl_type.match(/^(noun|adjective|numeral)/))
	    {
	        var is_simple = a_infl_type.match(/^(.+)_simplified$/)
	        if (is_simple != null)
	        {
	            /*
	             * simplified noun/adj table is just the regular table
	             * for that part of speech, reorded by gend-decl-type,
	             * and deduping duplicate endings (by attributes case, number, gender)
	             */
	            a_infl_type = is_simple[1];
	            a_params.xml_url = xml_url + 'alph-infl-' + a_infl_type + '-simpl.xml';
	            a_params.xslt_processor = butils.getXsltProcessor('alph-infl-single-grouping.xsl');
	            a_params.xslt_params.e_group4 = 'gend';
	            a_params.title = 'alph-infl-title-'+a_infl_type;
	        }
	        else
	        {
	            a_params.xml_url = xml_url + 'alph-infl-' + a_infl_type + '.xml';
	            a_params.xslt_processor = butils.getXsltProcessor('alph-infl-substantive.xsl');
	
	            if (a_params.order )
	            {
	
	                var order = a_params.order.split('-');
	                if (order.length > 0)
	                {
	                    a_params.xslt_params.e_group4 = order[0];
	                    a_params.xslt_params.e_group5 = order[1];
	                    a_params.xslt_params.e_group6 = order[2];
	                }
	            }
	        }
	        if (a_infl_type == 'numeral')
	        {
	            a_params.xslt_params.e_group4 = 'hdwd';
	            a_params.xslt_params.e_matchForm = true;
	        }
	    }
	    else if (a_infl_type == 'adverb')
	    {
	        a_params.xml_url = null;
	        a_params.xml_obj =
	            (new DOMParser()).parseFromString("<infl-data/>","text/xml");
	        a_params.xslt_processor = butils.getXsltProcessor('alph-infl-substantive.xsl');
	        a_params.xslt_params.e_linkContent="grammar:smyth:s341|See Smyth Sections 341-346 Adverbs"
	
	    }
	    if (typeof a_params.xslt_params.e_matchPofs  == 'undefined')
	    {
	        a_params.xslt_params.e_matchPofs = a_infl_type;
	    }
	};
	
	/**
	 * Greek specific inflection table display code
	 * @param {Element} a_tbl the inflection table element
	 * @param {Element} a_str the strings for the table display
	 * @param {Object} a_params the inflection window parameters
	 */
	LanguageTool_Greek.prototype.handleInflectionDisplay = function(a_tbl,a_str,a_params)
	{
	    // collapse all non-primary endings
	    // TODO - this may only be temporary - experimenting with different approaches
	    var ret_cells = [];
	    var show_stem_classes = [];
	    $("td.ending-group",a_tbl).each(
	        function(c_i)
	        {
	            var tdIndex = $(this).get(0).realIndex;
	            var collapsed = false;
	
	            var endings = $("span.ending", this);
	            var children = $(this).children();
	            // collapse lists of endings unless the cell has a highlighted ending,
	            // in which case just display them all
	            if ($(endings).length >0 )
	            {
	                var last_col_index = null;
	                children.each(
	
	                    function(a_i)
	                    {
	                        if ($(this).hasClass('ending'))
	                        {
	                            // reset the ending index
	                            last_col_index=null;
	                            // never hide selected or matched endings
	                            // and make sure to unhide any endings
	                            // of the same stem class
	                            if ($(this).hasClass("highlight-ending")
	                                // TODO - need to disambiguate stems for matched
	                                //(vs. selected) endings
	                                && ! $(this).hasClass("matched"))
	                            {
	                                var stem_class = $(this).attr("stem-class");
	                                if (stem_class != null && stem_class != '')
	                                {
	                                    stem_class.split(/\s/).forEach(
	                                        function(a_stem,a_si)
	                                        {
	                                            show_stem_classes.push(a_stem);
	                                        }
	                                    );
	
	                                }
	
	                            }
	                            // never hide the primary endings
	                            else if (! $(this).hasClass("primary"))
	                            {
	                                $(this).addClass("ending-collapsed");
	                                $(this).attr("ending-index",a_i);
	                                last_col_index=a_i;
	                                collapsed = true;
	                            }
	                        }
	                        else if (last_col_index != null &&
	                                 ($(this).hasClass("footnote") || $(this).hasClass("footnote-delimiter")))
	                        {
	                                $(this).addClass("ending-collapsed");
	                                $(this).attr("ending-index",last_col_index);
	                                collapsed = true;
	
	                        }
	                        else
	                        {
	                            // do nothing
	                        }
	                    }
	                );
	
	
	
	
	            }
	            // push the index of this table cell onto the return arry if
	            // if it has been flagged as containg any collapsed endings
	            if (collapsed)
	            {
	                ret_cells.push(tdIndex);
	            }
	        }
	    );
	
	    show_stem_classes = $.unique(show_stem_classes);
	    show_stem_classes.forEach(
	        function(a_stemclass,a_i)
	        {
	            $("#" + a_stemclass,a_tbl).addClass("highlight-ending");
	
	            // don't unhide the related endings for now -- too cluttered
	            //var like_stems = $("span.ending[stem-class='" + a_stemclass + "']",a_tbl);
	            //$(like_stems).each(
	                //function() {
	                    //if ($(this).hasClass("ending-collapsed"))
	                    //{
	                        //$(this).removeClass("ending-collapsed");
	                        //var ending_index = $(this).attr("ending-index");
	                        //$(this).nextAll("[ending-index='" + ending_index + "']").removeClass("ending-collapsed");
	                    //}
	                //}
	
	            //)
	
	        }
	    );
	
	    if (a_params.showpofs.indexOf('_simplified')!= -1)
	    {
	        // in the simplified view of the table,
	        // hide the declension headerrow and flag the
	        // table as simplified to enable
	        // other modifications via the css
	        $('#headerrow2',a_tbl).css('display','none');
	        $(a_tbl).addClass("simplified");
	    }
	
	    return ret_cells;
	
	};
	
	/**
	 * Greek-specific implementation of {@link Alph.LanguageTool#postTransform}.
	 * Looks up the lemma in the file of LSJ short meanings
	 * @param {Node} a_node the node containing the lookup results
	 */
	LanguageTool_Greek.prototype.postTransform = function(a_node)
	{
	    var lang_obj = this;
	    var defs = this.d_defsFile;
	    var lex = this.d_shortLexCode;
	    var stripper = this.d_stripper;
	    $(".alph-entry", a_node).each(
	        function()
	        {
	            // get lemma
	            var lemmaKey = $(".alph-dict", this).attr("lemma-key");
	            var defReturn = Array(null, null);
	            var i;
	
	            // for each lexicon
	            for (i = 0; i < lex.length; ++i)
	            {
	                // get data from defs file
	                var defReturn =
	                    LanguageTool_Greek.lookupLemma(lemmaKey,
	                                                           null,
	                                                           defs[i],
	                                                           stripper);
	                if (defReturn[1])
	                    break;
	            }
	
	            // if we found definition
	            if (defReturn[1])
	            {
	                // if extra info occurs in meaning, flag it with <span>
	                defReturn[1] =
	                    defReturn[1].replace(
	                        '(also possessive pronoun)',
	                        '<span class="alph-mean-extra">' +
	                          '(also possessive ' +
	                          '<span class="alph-nopad alph-pofs-extra" ' +
	                            'context="pronoun">' +
	                            'pronoun' +
	                          '</span>)' +
	                        '</span>');
	
	                // build meaning element
	                var meanElt = '<div class="alph-mean">' +
	                                defReturn[1] +
	                              '</div>';
	
	                // insert meaning into document
	                lang_obj.s_logger.debug("adding " + meanElt);
	                $(".alph-dict", this).after(meanElt);
	                
	                // build dictionary source element
	                var srcElt = '<div class="alph-dict-source">' +
	                    lang_obj.getString('dict.' + lex[i] + '.copyright') +
	                    '</div>';
	                $(".alph-dict", this).append(srcElt);
	
	                // set lemma attributes
	                lang_obj.s_logger.debug('adding @lemma-lang="grc"');
	                lang_obj.s_logger.debug('adding @lemma-key="' + defReturn[0] + '"');
	                lang_obj.s_logger.debug('adding @lemma-lex="' + lex[i] + '"');
	                $(".alph-dict", this).attr("lemma-lang", "grc");
	                $(".alph-dict", this).attr("lemma-key", defReturn[0]);
	                $(".alph-dict", this).attr("lemma-lex", lex[i]);
	            }
	            else
	            {
	                lang_obj.s_logger.warn("meaning for " +
	                              lemmaKey +
	                              " not found [" + lex.join() + "]");
	            }
	        }
	    );
	    var copyright = this.getString('popup.credits');
	    $('#alph-morph-credits',a_node).html(copyright);
	    
	};
	
	/**
	 * Removes the previous/next block from the Harvard LSJ output
	 * @ignore
	 */
	LanguageTool_Greek.prototype.fixHarvardLSJ = function(a_html)
	{
	    // look for the first <hr/> and remove everything before it
	    var match_hr = a_html.match(/(<hr\s*\/>)/m);
	    if (match_hr)
	    {
	        a_html = a_html.substring(match_hr.index+match_hr[1].length);
	    }
	    return a_html;
	};
	
	/**
	 * Greek-specific implementation of {@link Alph.LanguageTool#observePrefChange}.
	 *
	 * calls loadShortDefs and loadLexIds if the dictionary list changed
	 * @param {String} a_name the name of the preference which changed
	 * @param {Object} a_value the new value of the preference
	 */
	LanguageTool_Greek.prototype.observePrefChange = function(a_name,a_value)
	{
	    if (a_name.indexOf('dictionaries.short') != -1)
	        this.loadShortDefs();
	
	    if (a_name.indexOf('dictionaries.full') != -1)
	    {
	        this.loadLexIds();
	        this.lexiconSetup();
	    }
	};
	
	/**
	 * Greek-specific implementation of {@link Alph.LanguageTool#getLemmaId}.
	 *
	 * @param {String} a_lemmaKey the lemma key
	 * @returns {Array} (lemma id, lexicon code) or (null, null) if not found
	 * @type Array
	 */
	LanguageTool_Greek.prototype.getLemmaId = function(a_lemmaKey)
	{
	    // for each lexicon
	    for (var i = 0; i < this.d_fullLexCode.length; ++i)
	    {
	        // get data from ids file
	        var lemma_id =
	            LanguageTool_Greek.lookupLemma(a_lemmaKey,
	                                                a_lemmaKey,
	                                                this.d_idsFile[i],
	                                                this.d_stripper)[1];
	        if (lemma_id)
	            return Array(lemma_id, this.d_fullLexCode[i]);
	    }
	
	    logger.warn("id for " +
	                  a_lemmaKey +
	                  " not found [" +
	                  this.d_fullLexCode.join() + ']');
	
	    return Array(null, null);
	};
	
	/**
	 * Lookup lemma
	 *
	 * @param {String} a_lemma original lemma
	 * @param {String} a_key key to look up or null
	 * @param {Alph.Datafile} a_datafile datafile to search with key
	 * @param a_stripper transform to remove diacritics, etc.
	 * @returns {Array} (key, data)
	 * @type String
	 */
	LanguageTool_Greek.lookupLemma =
	function(a_lemma, a_key, a_datafile, a_stripper)
	{
	    if (!a_datafile) 
	        return Array(null, null);
	
	    var key;
	    var x = null;
	    if (!a_key)
	    {
	        // if no key given, strip vowel length diacritics and capitalization
	        a_stripper.setParameter(null, "e_in", a_lemma);
	        a_stripper.setParameter(null, "e_stripVowels", true);
	        a_stripper.setParameter(null, "e_stripCaps", true);
	        x = (new DOMParser()).parseFromString("<dummy/>", "text/xml");
	        key = a_stripper.transformToDocument(x).documentElement.textContent;
	    }
	    else
	    {
	        // use supplied key
	        key = a_key;
	    }
	
	    // count trailing digits
	    var toRemove = 0;
	    for (; toRemove <= key.length; ++toRemove)
	    {
	        // if not a digit, done
	        var c = key.substr(key.length - (toRemove + 1), 1);
	        if ((c < "0") || ("9" < c))
	            break;
	    }
	
	    // try to find data
	    var data = a_datafile.findData(key);
	    if (!data && (toRemove > 0))
	    {
	        // if not found, remove trailing digits and retry
	        key = key.substr(0, key.length - toRemove);
	        data = a_datafile.findData(key);
	    }
	
	    // if data found
	    if (data)
	    {
	        var sep = a_datafile.getSeparator();
	        var specialFlag = a_datafile.getSpecialHandlingFlag();
	
	        // find start and end of definition
	        var startText = data.indexOf(sep, 0) + 1;
	        var endText = data.indexOf('\n', startText);
	        if (data.charAt(endText - 1) == '\r')
	            endText--;
	
	        // if special case
	        if (((endText - startText) == 1) &&
	            (data.charAt(startText) == specialFlag))
	        {
	            // retry using flag plus lemma without caps removed
	            a_stripper.setParameter(null, "e_in", a_lemma);
	            a_stripper.setParameter(null, "e_stripVowels", true);
	            a_stripper.setParameter(null, "e_stripCaps", false);
	            if (!x)
	                x = (new DOMParser()).parseFromString("<dummy/>", "text/xml");
	            key = specialFlag +
	                   a_stripper.transformToDocument(x).
	                            documentElement.
	                            textContent;
	            data = a_datafile.findData(key);
	            if (!data)
	            {
	                // if not found, remove trailing digits and retry
	                key = key.substr(0, key.length - toRemove);
	                data = a_datafile.findData(key);
	            }
	
	            if (data)
	            {
	                startText = data.indexOf(sep, 0) + 1;
	                endText = data.indexOf('\n', startText);
	                if (data.charAt(endText - 1) == '\r')
	                    endText--;
	            }
	        }
	
	        // real data found
	        if (data)
	            return Array(key, data.substr(startText, endText - startText));
	    }
	
	    // nothing found
	    return Array(key, null);
	};
	
	/**
	 * Greek-specific implementation of {@link Alph.LanguageTool#normalizeWord}.
	 * Converts the word to precomposed unicode.
	 * @param {String} a_word the word 
	 * @returns the normalized version of the word
	 * @type String
	 */
	LanguageTool_Greek.prototype.normalizeWord = function(a_word)
	{
	    var normalized = this.d_converter.normalizeGreek(a_word);
	    return normalized;
	};
		
	/**
	 * Greek-specific implementation of {@link Alph.LanguageTool#normalizeWord}.
	 * Converts the word to precomposed unicode.
	 * @param {String} a_word the word 
	 * @returns the normalized version of the word
	 * @type String
	 */
	LanguageTool_Greek.prototype.getModule = function()
	{
		return module;
	};
	
	LanguageTool_Greek.prototype.getPref = function(a_name)
	 {
		 return (module.config())[a_name];
	 };
	
});