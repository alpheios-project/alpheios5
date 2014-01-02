/**
 * @fileoverview This file contains the definition of the prototype for an 
 * Alpheios state object. (Alph.State);

 * @version $Id: alpheios-state.js 2138 2009-10-05 11:50:59Z BridgetAlmas $
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
 * @class Alph.State defines the prototype object for holding the State of the 
 * Alpheios extension.
 * 
 * @constructor
 */
define([],function(){
	
	var State = {
	/**
     * default values are in the format [ <default value>, <persist boolean> ]
     */
	    'd_defaults' : {   
	    	'enabled': [false,true],
	        'toggled_by': [this.SYS_ACTION,true],
	        'windows': [{}, true], // A5 TODO Jsonify for storage
	        'panels': [{}, true],  // A5 TODO Jsonify for storage
	        'xlate_trigger': [null,true],
	        'current_language': ["",true],
	        'lastElem': [null,false],
	        'lastSelection': [null,false],
	        'lastWord': [null,false],
	        'word': [null,false], // TODO - these last two should be merged?,
	        'level': ['reader',false]
	    },
	    
	    /**
	     * static class variable for identifying state change by the system 
	     * @public
	     * @type int
	     */
	    'SYS_ACTION' : 1,
	    	    
	    /**
	     * static class variable for identifying state change by the user 
	     * @public
	     * @type int
	     */
	    'USER_ACTION' : 2,
	    	
	    /**
	     * namespace
	     */
	    'NAMESPACE' : "alpheios.net_",
	    	
	    resetToDefault : function(a_name) {
	    	    sessionStorage.setItem(this.NAMESPACE+a_name,this.d_defaults[a_name][0]);  
	    },
	    	
	    persist : function(a_name) {
	    	return this.d_defaults[a_name][1];  
	    },
	    	
	    /**
	     * Get a state variable
	     * @param {String} a_name the name of the variable
	     * @returns the value or null if the variable wasn't found
	     * @throws an Error if the variable hasn't been declared
	     */
	    	
	    getVar : function(a_name) {
	    	if (typeof this.d_defaults[a_name] != "undefined" )
	    	{
	    		return sessionStorage[this.NAMESPACE+a_name];
	    	}
	    	else
	    	{
	    		throw new Error("Attempt to retrieve undeclared state variable: " + a_name);
	    	}
	    },
	    	
	    /**
	     * Set a state variable
	     * @param {String} a_name the name of the variable
	     * @param a_value the value to set for the variable
	     * @throws an Error if the variable hasn't been declared
	     */
	    setVar : function(a_name,a_value) {
	    	if (typeof this.d_defaults[a_name] != "undefined")
	    	{
	    		sessionStorage[this.NAMESPACE+a_name] = a_value;
	    	}
	    	else
	    	{
	    		throw new Error("Attempt to set undeclared state variable: " + a_name);
	    	}
	   },
	    	
	   /**
	    * Resets the state to represent the disabled status 
	    */
	   setDisabled : function() {
		   this.enabled = false;

		   // clear all the temporary state
		   for (var name in this.d_defaults)
	    	{
			   if (! this.persist(name))
	    	   {
				   this.resetToDefault(name);                    
	    	   }
	    	}
	   }
	};
	for (var name in State.d_defaults)
    {
       State.resetToDefault(name);
    }
	return (State);
});