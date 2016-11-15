if (typeof(CBPP)==="undefined") {
    var CBPP = {};
    CBPP.load = function(deps, ready) {
        "use strict";
        var scripts = document.getElementsByTagName("script"), urlbase, src;
        for (var i = 0, ii = scripts.length; i<ii; i++) {
            src = scripts[i].getAttribute("src");
            if (typeof(src)==="string") {
                if (src.indexOf("CBPP_Shared/cbpp.js") !== -1) {
                    urlbase  = src.replace("cbpp.js","");
                }
            }
        }
        CBPP.urlBase = urlbase;
        if (typeof($)==="undefined") {
            var jquery = document.createElement("script");
            jquery.type = "text/javascript";
            jquery.src = urlbase + "jquery-1.12.4.min.js";
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