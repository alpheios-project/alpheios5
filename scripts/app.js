require.config({
    baseUrl: 'scripts',
    config: {
    	'lang-tool-greek': {
    		"contenturl":"http://localhost",
			"usemhttpd":"false",
			"chromepkg":"alpheios-greek",
			"languagecode":"grc,greek",
			"base_unit":"word",
			"methods_startup":'loadShortDefs,loadLexIds,loadStripper',
			"methods_convert":'greekToAscii',
			"methods_lexicon":'webservice',
			"url_lexicon": 'http://alpheios.net/perl',
			"url_lexicon_request": "/greek?word=<WORD>",
			"url_lexicon_timeout":"5000",
			"popuptrigger":'dblclick',
			"url_grammar":"chrome://alpheios-greek/content/alph-greek-grammar.xul",
			"grammar_hotlinks":"alph-decl,alph-pofs,alph-mood,alph-case,alph-voice,alph-pers,alph-tense,alph-pofs-extra",
			"features_alpheios-grammar":"true",
			"features_alpheios-inflect":"true",
			"context_handler":"grammarContext",
			"panels_use_defaults":"true",
			"dictionaries_short":"as,aut,ml,lsj",
			"dictionaries_full":"as,aut,lsj,ml",
			"dictionaries_full_default":"as",
			"dictionary_full_search_url":"http://repos1.alpheios.net/exist/rest/db/xq/lexi-get.xq?lx=<LEXICON>&lg=grc&out=html",
			"dictionary_full_search_lemma_param":"l",
			"dictionary_full_search_id_param":"n",
			"dictionary_full_search_multiple":"true",
			"sites_autoenable":"http://www.hs-augsburg.de/~harsch/graeca/,http://www.classicpersuasion.org/pw/heraclitus/herpatu.htm",
			"url_speech": 'http://localhost:8200/speech?voice=grc+f1?word=<WORD>'
    	}
    }
});

// Start the main app logic.
require(['jquery','main'],
function($, main) {
    //jQuery and main module are loaded and can be used here now.
	main.init();
});

