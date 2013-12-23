define(["require",'logger'], function(require,logger) {
 return {
	 "debug" :  false,
//	 "usemhttpd" : false,
//	 "mhttpd.host" : 'localhost',
//	 "mhttpd.port" : 8200,
	 "default_language" : "",
	 "log_logger_level" : "Warn",
	 "toolbar_lookup": true,	 
	 "morphservice": {
		 "remote": true,
		 "remote_url" : "http://alpheios.net/perl"
	 },
	 "popuptrigger" : 'dblclick',
	 "keys_toggle" : 'a',
	 "keymodifiers_toggle" : 'alt',
	 "grammar_window_loc": "bottomright",
	 "shift_window_loc" : "topleft",
	 "features": {
		 "alpheios-inflect" : false,
		 "alpheios-grammar" : false,
		 "alpheios-vocab" : true,
		 "alpheios-user-diagram" : true,
		 "alpheios-user-align" : true,
		 "alpheios-interlinear" : false,
		 "alpheios-speech" : true
	 },
	 "cmds": {
		 "alpheios-inflect-cmd" : "handleInflections",
		 "alpheios-morph-inflect-cmd" : "handleInflectionsForMorphWindow",
		 "alpheios-grammar-cmd" : "openGrammar",
		 "alpheios-diagram-cmd" : "openDiagram"
	 },
	 "panels": {
		 "sticky" : true,
		 "inline_alph-dict-panel" : false,
		 "inline_alph-tree-panel" : false,
		 "inline_alph-morph-panel" : false,
		 "inline_alph-trans-panel" : true,
		 "inline_alph-vocab-panel" : false,
		 "alph-dict-panel_pedagogical" : 0,
		 "alph-dict-panel_basic" : 0,
		 "alph-trans-panel_pedagogical" : 1,
		 "alph-trans-panel_basic" : 0,
		 "alph-tree-panel_pedagogical" : 0,
		 "alph-tree-panel_basic" : 0,
		 "alph-morph-panel_basic" : 0,
		 "alph-morph-panel_pedagogical" : 0,
		 "alph-vocab-panel_basic" : 0,
		 "alph-vocab-panel_pedagogical" : 0		 
	 },
	 "methods_dictionary_full_default" : 'defaultDictionaryLookup',
	 "methods_dictionary_full_default_timeout" : 10000,
	 "partsofspeech" : "noun,adjective,verb,adverb,pronoun,article,preposition,conjunction,verb_participle",
	 "textdirection" : "ltr",
	 "smallicons" : false,
	 "disable_remote" : false,
	 "url_speech_timeout" : 5000,
	 "survey_url" : "http://www.surveymonkey.com/s.aspx?sm=IG7mAWG026Z4JYB_2f5dsXEw_3d_3d",
	 "user" : {
		 "model" : "ffprofileplus",
		 "save_interval_lookup_num" : 5,
		 "backup_keep" : 1,
		 "backup_interval" : "request",
		 "backup_interval_lookup_num" : 10,
		 "restore_interval" : "request",
		 "restore_confirm" : false,
		 "clear_interval" : "request",
		 "dataservice" : "local",
		 "datatypes" : "words,diagrams",
		 "datatype_words_class" : "WordList",
		 "datatype_words_resource" : "resource://alpheios/datatypes/WordList.jsm",
		 "datatype_diagrams_class" : "TreeDiagram",
		 "datatype_diagrams_resource" : "resource://alpheios/datatypes/TreeDiagram.jsm",
		 "dataservices" : "local",
		 "dataservice_none_description" : "Firefox Profile Directory",
		 "dataservice_none_class" : "DataService",
		 "dataservice_none_resource" : "resource://alpheios/services/alpheios-dataservice.jsm",
		 "dataservice_local_description" : "Local Zip File",
		 "dataservice_local_class" : "DataServiceLocal",
		 "dataservice_local_resource" : "resource://alpheios/services/alpheios-dataservice-local.jsm",
		 "dataservice_local_backup_file" : "",
		 "dataservice_local_restore_file" : "",
		 "dataservice_local_backup_to_restore" : false,
		 "wordlist_lookup_threshold" : 3,
		 "diagram_url":'http://repos1.alpheios.net/exist/rest/db/app/treebank-entertext.xhtml',
		 "align_url":'http://repos1.alpheios.net/exist/rest/db/app/align-entersentence.xhtml',
		 "notifydisable" : false
	 },
	 "interface": {
		 "vocab_filter" : 'all',
		 "diagram_lang" : 'greek',
		 "diagram_fmt" : 'aldt',
		 "diagram_fmt_ara" : 'catib',
		 "diagram_dir" : 'ltr',
		 "diagram_dir_ara" : 'rtl'		 
	 },
	 "diagram_url":
	     'http://repos1.alpheios.net/exist/rest/db/app/treebank-editsentence.xhtml?doc=DOC&s=SENTENCE&lang=LANG&sequential=SEQUENTIAL&sentenceNavigation=no&subdoc=SENTENCE&direction=DIRECTION',
     "chromepkg" : 'alpheios',   
     "contenturl" : 'http://localhost/alpheios/content',
     "styleurl" : 'http://localhost/alpheios/stylesheets',

	 set: function(a_name,a_value) {
		 // TODO hierarchical values
		 this[a_name] = a_value;
	 },
	 
	 get: function(a_name,a_lang) {
		 var value = null;
	     // TODO hierarchical values
		 if (a_lang != null) {
			var main = require('main');
			var tmp = $('<div lang="' + a_lang + '"/>').get(0);
			try {
				var lt = main.getLanguageTool(tmp);
				value = lt.getPref(a_name);
			} catch (a_e) {
				logger.warn("Unable to get " + a_lang + " language tool to check preference " + a_name);
			}
		 }
		 if (value == null) {
			 value = this[a_name];
		 }
		 return value;
	 }
 };
});