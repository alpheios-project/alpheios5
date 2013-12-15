/**
 * @fileoverview Defines miscellaneous constants for the Alpheios extensions.
 * This module exports a single symbol, Constants, which must be imported into 
 * the namespace of the importing class.
 *
 * @version $Id: alpheios-constants.jsm 2369 2009-12-22 19:50:02Z BridgetAlmas $
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
 
define([], function() {

/**
 * @class Alpheios Application Constants
 */
	return {	
		    /**
		     * Event types
		     * @constant
		     */
		    EVENTS: 
		        {
		            SHOW_TRANS: 100,
		            HIDE_POPUP: 200,
		            REMOVE_POPUP: 300,
		            SHOW_DICT: 400,
		            UPDATE_PREF: 500,
		            LOAD_DICT_WINDOW: 600,
		            LOAD_TREE_WINDOW: 700,
		            UPDATE_XLATE_TRIGGER: 800,
		            LOAD_VOCAB_WINDOW: 900,
		            VOCAB_UPDATE: 1000
		        },
		
		    /**
		     * Levels (modes)
		     * @constant
		     */
		    LEVELS: 
		    {
		        LEARNER: 'learner',
		        READER: 'reader',
		    },    
		    
		    /**
		     * Preferences strings
		     */
		     DSVC_NONE: "none",
		     DSVC_LIST : "user.dataservices",
		     DSVC : "user.dataservice",
		     DTYPE_LIST : "user.datatypes",
		     DTYPE : "user.datatype",
		     RESOURCE : "resource",
		     CLASSNAME : "class",
		     DESCRIPTION: "description",
		     SAVE: "user.save",
		     BACKUP : "user.backup",
		     RESTORE : "user.restore",
		     CLEAR: "user.clear",
		     CONFIRM : "confirm",
		     KEEP : "keep",
		     INTERVAL : "interval",
		     ONAPPLOAD : "appload",
		     ONENABLE : "enable",
		     ONLOOKUP : "lookup",
		     NUMLOOKUPS : "lookup.num",
		     ONDISABLE : "disable",
		     ONAPPQUIT : "appquit",
		     ONREQUEST : "request",
		     DMODEL:  "user.model",
		     BACKUP_FILE: 'alpheios-backup.zip',
		     VOCAB_FILTER: 'interface.vocab.filter'
	};
});