// JavaScript Document
var InteractiveLoader = function () {
	"use strict";
	function isAsyncSupported() {
		var test = document.createElement("script");
		test.setAttribute("async", false);
		return (typeof(test.async)!=="undefined");
	}
	this.load = function (id, toLoad, toLoadDiv, fallbackHeight, fallbackWidth) {
		var src = toLoad;
		src = src.split("/");
		src.pop();
		var url_root = src.join("/");
		var readyFunction = function () {
			var response = xhttp.responseText;
			var temp = document.createElement("div");
			var target = document.getElementById(id);
			temp.innerHTML = response;
			var stylesheets = temp.querySelectorAll("link");
			function adjustURL(url) {
				if (url===null) {return url;}
				if (url.substring(0,4)==="http" || url.substring(0,2) === "//") {
					return url;
				}
				var urlBase = (toLoad).split("/");
				urlBase.splice(-1);
				url = url.split("/");
				for (var i = 0, ii = url.length;i<ii;i++) {
					if (url[i] === "..") {
						urlBase.splice(-1);
						url.splice(0,1);
						ii--;
					}
				}
				var rString = "";
				rString += urlBase[0] + "//";
				urlBase.splice(0,2);
				rString += urlBase.join("/") + "/" +  url.join("/");
				return rString;
			}
			for (var i = 0, ii = stylesheets.length; i<ii; i++) {
				if (document.createStyleSheet) {
					console.log(stylesheets[i].getAttribute("href"));
					document.createStyleSheet(stylesheets[i].getAttribute("href"));
				} else {
					stylesheets[i].href = adjustURL(stylesheets[i].getAttribute("href"));
					document.getElementsByTagName("head")[0].appendChild(stylesheets[i]);
				}
			}
			var tempEls = temp.querySelector("#" + toLoadDiv);
			target.appendChild(tempEls);
			var scripts = temp.getElementsByTagName("script");
			var j, jj, nodeName, nodeValue;
			for (i = 0, ii = scripts.length; i<ii; i++) {
				var s = document.createElement("script");
				for (j = 0, jj = scripts[i].attributes.length; j<jj; j++) {
					nodeName = scripts[i].attributes[j].nodeName;
					nodeValue = scripts[i].attributes[j].nodeValue;
					if (nodeName === "src") {
						nodeValue = adjustURL(nodeValue);
					}
					s.setAttribute(nodeName, nodeValue);
				}
				if (scripts[i].innerHTML !== "") {
					s.innerHTML = scripts[i].innerHTML;
				}
				s.async = false;
				document.getElementsByTagName("body")[0].appendChild(s);
			}
			
		};
		try {
			if (!isAsyncSupported()) {
				var iframe = document.createElement("iframe");
				iframe.height = fallbackHeight;
				iframe.width = fallbackWidth;
				iframe.src = toLoad;
				iframe.frameBorder = "no";
				document.getElementById(id).appendChild(iframe);
				return false;
			}
			
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function () {
				if (xhttp.readyState === 4 && xhttp.status === 200) {
					readyFunction();
				}
			};
			xhttp.open("GET", toLoad, true);
			xhttp.setRequestHeader("Content-Type", "text/plain");
			xhttp.send();
		} catch (ex) {
			console.log(ex);
			try {
				var xhttp = new XDomainRequest();
				xhttp.onload = readyFunction;
				xhttp.open("GET", url_root + toLoad, true);
				xhttp.send();
			} catch (_ex) {
				console.log(_ex);
			}
		}
	};
};
/*exported InteractiveLoader*/