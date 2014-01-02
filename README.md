alpheios5
=========

This repository contains a prototype of a conversion of the Alpheios Language Tool Firefox plugins code to a browser-independent library and bookmarklet.  It roughly follows the spec outlined at http://alpheios.net/content/alpheios-firefox-plugins#html5spec .

## Status as of January 2, 2014

* Basic morphological lookup of a word and link to full definition in a dictionary are implemented for Greek. Tested in Safari and Chrome (doesn't work in Firefox yet, ironically). Also works in Safari on iPhone but UI isn't optimized for mobile devices yet.
* The code can be used as a library included by the author of an HTML page or as a bookmarklet inserted by a user into any page.
    * The library version is included via require.js, specifying app.js as the main module. E.g. ` <script data-main="scripts/app.js" src="scripts/require.js"></script>` (See libtest.html in the main directory of this repo)
    * The bookmarklet is an optimized version of the full library code, compressed into a single file using the [require.js optimizer](http://requirejs.org/docs/optimization.html). This gets included in a browser page by using a bookmarklet which executes the following javascript: 
    `javascript:void((function() {var element=document.createElement('script');element.setAttribute('src','http://alpheios.net/bookmarklet/scripts/alph.js');document.body.appendChild(element)})());` 
    (See bktest.html in the main directory of this repo)

### Summary of implementation steps

### Outstanding issues and roadmap
