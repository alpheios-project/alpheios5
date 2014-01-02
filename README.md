alpheios5
=========

This repository contains a prototype conversion of the Alpheios Language Tool Firefox plugins code to a browser-independent library and bookmarklet.  It roughly follows the spec outlined at http://alpheios.net/content/alpheios-firefox-plugins#html5spec .

## Status as of January 2, 2014

* Basic morphological lookup of a word and link to full definition in a dictionary are implemented for Greek. Tested in Safari and Chrome (doesn't work in Firefox yet, ironically). Also works in Safari on iPhone but UI isn't optimized for mobile devices yet.
* The code can be used as a library included by the author of an HTML page or as a bookmarklet inserted by a user into any page.
    * The library version is included via require.js, specifying app.js as the main module. E.g. ` <script data-main="scripts/app.js" src="scripts/require.js"></script>` (See libtest.html in the main directory of this repo)
    * The bookmarklet is an optimized version of the full library code, compressed into a single file using the [require.js optimizer](http://requirejs.org/docs/optimization.html). The optimization is run via node.js using the configuration in app.build.js. E.g. `node ../r.js -o scripts/app.build.js` This gets included in a browser page by using a bookmarklet which executes the following javascript: 
    `javascript:void((function() {var element=document.createElement('script');element.setAttribute('src','http://alpheios.net/bookmarklet/scripts/alph.js');document.body.appendChild(element)})());` 
    (See bktest.html in the main directory of this repo)
       * Prototype page providing a link to the prototype bookmarklet is deployed at http://alpheios.net/bookmarklet/bktest.html

### Implementation details
* Used [require.js](http://requirejs.org) library to manage modular script dependencies via AMD (asynchronous module definition), replacing the use of the Firefox components UI. See also http://requirejs.org/docs/whyamd.html.
* converted the Firefox-specific string bundles for the UI text to the structure supported by the require.js [i18n plugin](http://requirejs.org/docs/api.html#i18n)
* Eliminated the use of the hard-coded Alph namespaced object. The namespace is now managed via the require.js optimization build, rather than hardcoded into the individual modules. This should allow for greater portability of the code.
* Used the [Sarissa](http://dev.abiss.gr/sarissa/) library for cross-browser XSLT handling (this may or may not be necessary - it isn't working fully now on Firefox so this needs futher investigation).
* Made the Alpheios state object an adapter to the HTML5 sessionStorage API  - only simple string values are currently supported (therefore window and panel state management is disabled for now)
* app.js acts as the main controller. It calls main.js:init to automatically enable the tools for Greek (language selection is currently hard-coded) upon load.
* I've just deployed the supporting non-javascript resources (i.e. css stylesheets, icons and xslt) manually on the alpheios.net server for now by copying them from the sourceforge repo. These all still need to be ported to the new code structure.

### Outstanding issues/roadmap
* Module dependencies need to be cleaned up further and made more concise
* Currently the code assumes it's okay to allow jQuery to be added to the global namespace (i.e. as $ and jQuery). We probably want to use jQuery noConflict to prevent that, but it was causing some problems for the optimizer and also means that we have to port any jQuery plugins we want to use to AMD if they don't already support it (e.g. jquery.tap did not at first glance).
* Add the other languages (Latin, Arabic, Chinese) and provide UI for user to disable/enable specific languages (i.e. we don't want them to have to load all resources for all languages each time the bookmarklet is enabled)
* Implement the UI for managing all of the Alpheios features and user preferences. I.e. the equivalent to the Alpheios toolbar from the plugins. 
    * Also need to determine which UI elements should be implemented as secondary windows, and which embedded in in the page
* Implement Alpheios UI events
* Implement the inflections and grammar features
* Implement the enhanced site functionality
* Implement the quiz functionality
* Implement support for offline access via HTML5 Caching and IndexedDB 
* Implement user data features
* Optimize the UI for mobile devices
* Enable touch events instead of tap as alternative to mousemove event for triggering lookup on mobile devices (i.e. for character-based tokens instead of space-separated)
* Sort out cross-browser XSLT issues and verify whether Sarissa is really needed
* Figure out how to enable bookmarklet under Chrome mobile
* Port CSS, icons and XSLT stylesheets from Sourceforge repo and create build and deploy scripts
* Investigate browser-plugin options as wrapper to the base code (to provide enhanced functionality across pages as alternative to bookmarklet)
