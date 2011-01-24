(function() {
    function dispatch_callback(jo) {}
    function init() {
        var body, h = document.location && document.location.host, d_hosts=["bit.ly", "bitly.org", "j.mp", "bitly.net"];
        if( d_hosts.indexOf( h ) >=0 ) {
            var promos = document.getElementsByClassName("ext_bitly_chrome_promo_delay"), elem, mark=document.createElement("span");
            for(var i=0; i<promos.length; i++) {
                elem=promos[i];
                elem.parentNode.removeChild(elem);
            }
            mark.className="has_bitly_chrome_ext_installed";
            mark.setAttribute("style", "display:none;")
            document.body.appendChild( mark  );
        } else if(h) {
            chrome.extension.sendRequest({'action' : 'page_loaded', 'domain_host' : h || "" }, dispatch_callback);
        }
    }
    init();
})();

