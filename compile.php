<?php

$base_script = $_GET["script"];
$base_cbpp_loader = $_GET["cbpp_version"];
$js_loc = __DIR__."/../".$base_script;
$js = file_get_contents($js_loc);
$js_dir = explode("/",$js_loc);
array_pop($js_dir);
$js_dir = implode("/",$js_dir) . "/";
$cbpp_js = file_get_contents("cbpp_v" . $base_cbpp_loader.".js");
preg_match("/CBPP\.JQUERY_URL\s*=\s*\"(.*?)\";/", $cbpp_js, $jquery_matches);

$compiled_script = "";
$dep_scripts = array();
preg_match("/CBPP\.load\(\[(.*?)\],\sfunction\(\)\s\{(.*)\}/s", $js, $matches);
$deps = $matches[1];
$scripts_to_append = "";
$deps = "[" . $deps . "]";
$deps = str_replace("name", '"name"', $deps);
$deps = str_replace("version", '"version"', $deps);
$deps = json_decode($deps);
$compiled_script .= file_get_contents($jquery_matches[1]);
$compiled_callback = rewriteScriptText($matches[2], null, null);

ob_start();?>
var CBPP = {};
CBPP.scriptServer = $("script[data-cbpp=true]")[0].src.split("/");
CBPP.scriptServer = CBPP.scriptServer[0] + "//" + CBPP.scriptServer[2];
CBPP.urlBase = CBPP.scriptServer + '/CBPP_Shared/';
CBPP.loadedScripts = <?php echo count($deps); ?>;
CBPP.scriptLoadCallback = function() {
    CBPP.loadedScripts--;
    if (CBPP.loadedScripts===0) {
        CBPP.compiledCallback();
    }
};
CBPP.compiledCallback = function() {
    <?php echo $compiled_callback["script"]; ?>
};
CBPP.dependencies = {};
CBPP.addDependency = function(scriptUrl, callbackID, request_end) {
    if (typeof(CBPP.dependencies[scriptUrl])==="undefined") {
        CBPP.dependencies[scriptUrl] = [];
    }
    CBPP.dependencies[scriptUrl][callbackID] = request_end;
};
<?php
$compiled_script .= ob_get_clean(); 

for ($i = 0, $ii = count($deps); $i<$ii; $i++) {
    $dep = $deps[$i];
    $compiled_script .= compile("cbpp_" . strtolower($dep->name) . ".js", $dep->name, $dep->version);
    $compiled_script .= "CBPP.".$dep->name.".version = " . $dep->version . ";";
    $compiled_script .= "CBPP.".$dep->name.".load(CBPP.scriptLoadCallback);";
    
}

function replacement($url, $callbackID, $request_fulfilled) { 
    return "CBPP.addDependency(\"{$url}\",{$callbackID},{$request_fulfilled});";
}

function rewriteScriptText($script, $name, $version) {
    global $dep_scripts;
    global $scripts_to_append;
    global $js_dir;
    $require_pattern = "/CBPP\.JS\(CBPP_URL_ROOT\ \+ \"(.*?)\"\,\s(.*?)\);/";
    preg_match_all($require_pattern, $script, $matches);
    $to_append = "";
    for ($i = 0, $ii = count($matches[0]);$i<$ii;$i++) {
        $dep = compile($matches[1][$i], $name, $version);
        $subURL = $matches[1][$i];
        $subID = $dep_scripts[$subURL];
        $dep_scripts[$subURL]++;
        $script = str_replace($matches[0][$i], replacement($matches[1][$i], $subID, $matches[2][$i]), $script);
        if ($name===null) {
            $script .= $dep . "CBPP.dependencies['{$subURL}'][{$subID}]();";
        } else {
            $to_append .= $dep . "CBPP.dependencies['{$subURL}'][{$subID}]();";
        }
    }
    $data_pattern = "/CBPP\.CSVDATA\(CBPP_URL_ROOT\ \+ \"(.*?)\"\,\s(.*?)\);/";
    preg_match_all($data_pattern, $script, $data_matches);
    for ($i = 0, $ii = count($data_matches[0]);$i<$ii;$i++) {
        $dep = file_get_contents($js_dir.$data_matches[1][$i]);
        $dep = str_replace('"','\\"',$dep);
        $dep = str_replace("\r\n","\\n",$dep);
        $replacement = $data_matches[2][$i] . "(\"". $dep . '");';
        $script = str_replace($data_matches[0][$i], $replacement, $script);
    }
    return array(
        "script"=>$script,
        "to_append"=>$to_append
    );
}

function compile($url, $name, $version) {
    global $scripts_to_append;
    global $dep_scripts;
    global $js_dir;
    if (!array_key_exists($url, $dep_scripts)) {
        $dep_scripts[$url] = 0;
    }
    $callbackID = $dep_scripts[$url];
    $script = "";
    if ($callbackID === 0) {
        if ($name===null) {
            $url_base = $js_dir;
        } else {
            $url_base = __DIR__ . "\\CBPP_" . $name . "\\v" . $version . "\\";
        }
        $script_url =  $url_base . $url;
        $script = file_get_contents($script_url);

        $rewritten = rewriteScriptText($script, $name, $version);
        $script = $rewritten["script"];
        $scripts_to_append .= $rewritten["to_append"];

        $css_pattern = "/CBPP\.CSS\(CBPP_URL_ROOT\ \+ \"(.*?)\"\,\s(.*?)\);/";
        preg_match_all($css_pattern, $script, $cssMatches);
        for ($i = 0, $ii = count($cssMatches[0]);$i<$ii;$i++) {
            $dep = file_get_contents($url_base . $cssMatches[1][$i]);
            $dep = preg_replace( "/\r|\n/", "", $dep);
            $css_insert = "(function() {";
            $css_insert .= "var node = document.createElement('style');";
            $css_insert .= "node.innerHTML = \"" . addcslashes($dep, '"') . "\";";
            $css_insert .= 'document.getElementsByTagName("head")[0].appendChild(node);';
            $css_insert .= "}());";
            $script = str_replace($cssMatches[0][$i], $css_insert . $cssMatches[2][$i]."();", $script);
            //$script = str_replace('"use strict";',"", $script);
        }
        $script = "(function() {" . $script . "}());";

        
    } 

    return $script;
}

$scripts_to_append .= $compiled_callback["to_append"];
$compiled_script .= $scripts_to_append;

require("Minifier.php");
header('Content-Type: application/javascript; charset=utf-8');
echo \JShrink\Minifier::minify($compiled_script, array('flaggedComments' => false));
//echo $compiled_script;