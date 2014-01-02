/**
 * @fileoverview This file defines a wrapper around the i18n module
 * to replace string placeholders with supplied values.
 *
 * Copyright 2014 The Alpheios Project, Ltd.
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

define(['require','i18n!nls/baseui','i18n!nls/greekstrings'],function(require,baseui,greek) {
	return {
		
		// A5 TODO find a better way to handle Alpheios language-specific UI strings 
		langStr: {
			'greek' : greek
		},
		
		getString: function(a_string) {
			return baseui[a_string];
				
		},
		
		getString: function(a_string,a_replace) {
			var str = baseui[a_string];
			if (str) {
				if (typeof a_replace == 'array') {
					for (var i=0; i<a_replace.length; i++) {
						str = str.replace(/%S/,a_replace[i]);
					}
				} else if (a_replace) {
					str = str.replace('%S',a_replace);
				}
			} else {
				// if we couldn't find it, just return the string name
				str = a_string;
			}
			return str;
		},
				
		getLanguageString: function(a_lang,a_string,a_replace) {
			var langstr = this.langStr[a_lang];
			var str = langstr[a_string];
			if (str) {
				if (typeof a_replace == 'array') {
					for (var i=0; i<a_replace.length; i++) {
						str = str.replace(/%S/,a_replace[i]);
					}
				} else if (a_replace) {
					str = str.replace('%S',a_replace);
				}
			} else {
				// if we couldn't find it, just return the string name
				str = a_string;
			}
			return str;
		}
	};
});;