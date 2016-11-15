if (typeof(CBPP)==="undefined") {
    var CBPP = {};
    CBPP.JS = function(url, end_request) {
        /*globals $*/
        "use strict";
        var request = $.getScript(url, end_request);
    };
    CBPP.CSS = function(url, end_request) {
        "use strict";
        var l = document.createElement("link");
		l.type="text/css";
		l.href= url;
		l.rel = "stylesheet";
		document.getElementsByTagName("head")[0].appendChild(l);
        l.onload = end_request;
		l.load = end_request;
    };
    CBPP.JQUERY_URL = "jquery-1.12.4.min.js";
    CBPP.CSVDATA = function(url, end_request) {
        "use strict";
        $.get(url, function(d) {
            end_request(d);
        });
    };
    CBPP.load = function(deps, ready) {
        "use strict";
        var scripts = document.getElementsByTagName("script"), urlbase, src;
        for (var i = 0, ii = scripts.length; i<ii; i++) {
            src = scripts[i].src;
            if (typeof(src)==="string") {
                if (src.indexOf("CBPP_Shared/cbpp_v0.2.js") !== -1) {
                    CBPP.urlBase = urlbase  = src.replace("cbpp_v0.2.js","");
                    CBPP.scriptServer = src.replace("CBPP_Shared/cbpp_v0.2.js","");
                }
            }
        }
        if (typeof($)==="undefined") {
            var jquery = document.createElement("script");
            jquery.type = "text/javascript";
            jquery.src = CBPP.urlBase + CBPP.JQUERY_URL;
            var done = false;
            jquery.onload = jquery.onreadystatechange = function() {
                if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                    done = true;
                    CBPP.load(deps, ready);
                }
            };
            document.getElementsByTagName("head")[0].appendChild(jquery);
            return;
        }

        var scriptsRequested = 0;
        var scriptsLoaded = 0;
        var loadCallback = function() {
            scriptsLoaded--;
            if (scriptsLoaded === 0) {
                ready();
            }
        };
        var scriptLoaded = function() {
            scriptsRequested--;
            if (scriptsRequested === 0) {
                ii = deps.length;
                for (i = 0; i<ii; i++) {
                    scriptsLoaded++;
                    CBPP[deps[i].name].version = deps[i].version;
                    CBPP[deps[i].name].load(loadCallback, deps[i].options);
                }
            }
        };
        $(document).ready(function() {
            var scriptURL;
            for (var i = 0, ii = deps.length; i<ii;i++) {
                scriptURL = urlbase + "CBPP_" + deps[i].name + "/v" + deps[i].version + "/cbpp_" + deps[i].name.toLowerCase() + ".js";
                $.getScript(scriptURL, scriptLoaded);
                scriptsRequested++;
            }
        });
    };
}