(function() {
    function dispatch_callback(jo) {}
    function init() {
        var body, h = document.location && document.location.host;
        if(h) {
            chrome.extension.sendRequest({'action' : 'page_loaded', 'domain_host' : h || "" }, dispatch_callback);
        }
    }
    init();
})();

