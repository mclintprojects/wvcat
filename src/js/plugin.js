parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"XoA9":[function(require,module,exports) {
module.exports={match:/https:\/\/www.google.com/g,commands:[{element:"search-input",match:["search for *query"],onmatch:function(e){window.location.href="https://www.google.com/search?q=".concat(e)}},{element:"im-feeling-button",match:["i'm feeling lucky"],onmatch:function(){wvcat.execute("click i'm feeling lucky button")}}]};
},{}],"GOVZ":[function(require,module,exports) {
var n=require("./google");module.exports=function(){var t=[n];this.initialize=function(n,o){var a=t.find(function(n){return n.match.test(o)});a&&a.commands.forEach(function(t){t.match.forEach(function(o){n.addCustomCommand(t.element,o,t.onmatch)})})}};
},{"./google":"XoA9"}]},{},["GOVZ"], "Plugin")
//# sourceMappingURL=/plugin.js.map