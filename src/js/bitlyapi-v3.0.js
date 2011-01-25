/*
    A BITLY JS API
        - Little wrapper object to handle bit.ly API calls
            api.bit.ly
*/

(function() {

// TODO
// move this info to settings file
var host = "http://api.bit.ly",
    ssl_host = "https://api-ssl.bit.ly",
    urls = {
        'shorten' : '/v3/shorten',
        'expand' : '/v3/expand',
        'info' : '/v3/info',
        'auth' : '/v3/authenticate',
        'oauth' : '/oauth/access_token',
        'accounts' : '/v3/user/share_accounts',
        'domains' : '/v3/all_domains',
        'share' : '/v3/user/share',
        'clicks' : '/v3/clicks',
        'lookup' : '/v3/lookup',
        'clicks_by_minute' : '/v3/clicks_by_minute',
        'realtime' : '/v3/user/realtime_links',
        'metrics_base' : '/v3/user/'
    }, errors = [];
    
    ///user/(clicks|country|referrers), /user/realtime_links
var bitlyAPI = function( client_id, client_secret, settings  ) {
    
    host = (settings && settings.host) || host;
    // setting.url = {} will override the 'urls={ ... }'
    urls = extend({}, urls, (settings && settings.urls) );
    return new BitApi( client_id, client_secret )
}
window.bitlyAPI = bitlyAPI;
// TODO
// check to make sure there is no NameSpace collision
function BitApi( client_id, client_secret ) {
    return this.init( client_id, client_secret  );
}

BitApi.prototype = {
    
    bit_request : {
        format : 'json',
        domain : 'bit.ly',
        access_token : null,
        login : null,
        apiKey : null
    },
    
    oauth_client : {
        client_id : null,
        client_secret : null,
        x_auth_username : '',
        x_auth_password : ''
    },
    
    version : "3.0",
    count : 0, // internal request counter, this is the number of times certain methods are called
    
    init : function(  client_id, client_secret ) {
        this.set_oauth_credentials( client_id, client_secret );
        return this;
    },
        
    shorten : function( long_url, callback ) {
        var params = extend({}, this.bit_request, { 'longUrl' : long_url } );
        delete params.access_token
        this.count+=1;
        bitlyRequest( host + urls.shorten, params, callback);
    },
    
    expand : function(  short_urls, callback ) {
        this.count+=1;
        var params = { 'login' : this.bit_request.login,
                        'apiKey' : this.bit_request.apiKey,
                        'shortUrl' : short_urls };
        internal_multiget( host + urls.expand, 'shortUrl', params, callback);
    },
    
    expand_and_meta : function( short_urls, callback ) {
        // 1. run an expand,
        // 2. run an info
        // 3. run a clicks
        // stitch all, return data
        var requests = 3, final_results = {};
        
        function sticher( response ) {
            requests-=1;
            // clicks || info || expand
            var items = [], item_hash, store;
            try {
                items = response.clicks || response.info || response.expand;
            } catch(e) {}
            
            for(var i=0; items && i<items.length; i++) {
                
                if(items[i].error) continue;
                
                item_hash = items[i].short_url
                if(!final_results[ item_hash ] ) {
                    final_results[ item_hash ] = items[i];
                } else {
                    // merge in new values
                    // if I was using jQuery, I would just call $.extend({}, obj1, obj2)
                    // TODO
                    // see if extend will work here...
                    store = final_results[ item_hash ]
                    for(var k in items[i]) {
                        if( store[k] ) continue;
                        store[k] = items[i][k]
                    }
                }
            
            }
            
            if(requests<=0) {
                // put it all together
                var list_results = [], count=0;
                for(var key in final_results) {
                    count+=1;
                    list_results.push( final_results[key] )
                }
                callback( {'expand_and_meta' : final_results, 'list_results' : list_results, 'total' : count } );
            }
        }
        this.expand( short_urls, sticher );
        this.info( short_urls, sticher );
        this.clicks( short_urls, sticher);
    },
    
    
    clicks : function(short_urls, callback) {
        // yet another one that needs stitching...
        this.count+=1;
        var params = { 'login' : this.bit_request.login,
                        'apiKey' : this.bit_request.apiKey,
                        'shortUrl' : short_urls };
        internal_multiget( host + urls.clicks, 'shortUrl', params, callback );
    },
    
    clicks_by_url : function( long_urls, callback ) {
        this.count+=1;
        // todo
        // not working
        var request_count = 2, lookup_urls, lookup_url, i=0;
        function sticher( jo ) {
            request_count -= 1;
            
            if(jo.lookup) {
                for( ; lookup_url=jo.lookup[i]; i++) {
                    console.log(lookup_url.url, "implement clicks call, make only one clicks call...")
                }
            }
        }
        
        this.lookup(long_urls, sticher);
    },

    
    info : function( short_urls, callback ) {
        this.count+=1;
        var params = { 'login' : this.bit_request.login,
                        'apiKey' : this.bit_request.apiKey,
                        'shortUrl' : short_urls };
        internal_multiget( host + urls.info, 'shortUrl', params, callback );
    },
    
    lookup : function(long_urls, callback) {
        this.count+=1;
        var params = { 'login' : this.bit_request.login,
                        'apiKey' : this.bit_request.apiKey,
                        'url' : long_urls };
        internal_multiget( host + urls.lookup, 'url', params, callback );
    },
    
    realtime_clicks_by_minutes : function( shortUrls, callback ) {
        // http://api.bitly.net/v3/clicks_by_minute?
        //login=XXXXXXX&apiKey=XXXXXXXXXXXXXXXXXXXXXXX&shortUrl=http://stk.ly/b45q7L
        var params = {}
        
        this.count+=1;
        var params = { 'login' : this.bit_request.login,
                        'apiKey' : this.bit_request.apiKey,
                        'shortUrl' : shortUrls };
        internal_multiget( host + urls.clicks_by_minute, 'url', params, callback );        
    },
    

    /*
        SSL Hosts (HTTPS)
    */

    
    realtime : function( callback ) {
        var params = { 'access_token' : this.bit_request.access_token }
        bitlyRequest( ssl_host + urls.realtime, params, callback );
    
    },
    
    metrics : function(type, callback) {
        var possible_tpes = ["clicks","countries","referrers"],
            url = (ssl_host + urls.metrics_base + type), params = { 'access_token' : this.bit_request.access_token };
        if(possible_tpes.indexOf( type ) === -1 ) {
            callback({'error' : 'unknown api, api call ignored'})
            return;
        }
        
        bitlyRequest( url, params, callback );
    },
    
    share_accounts : function( callback ) {
        if(!callback) callback = function(){ console.log(arguments); }
        // this is an oauth endpoint -- /v3/user/share_accounts
        var params = { 'access_token' : this.bit_request.access_token }
        this.count+=1;
        bitlyRequest( ssl_host + urls.accounts, params, callback);
    },
    
    bitly_domains : function( callback )  {
        //
        var params = { 'access_token' : this.bit_request.access_token }
        bitlyRequest( ssl_host + urls.domains, params, callback);
    },
    
    share : function( params, callback ) {
        var params = extend({}, params, { 'access_token' : this.bit_request.access_token });
        this.count+=1;
        bitlyRequest( ssl_host + urls.share, params, callback);
    },
    
    auth : function( username, password, callback ) {
        // call the set credentials  when this is run
        var self = this,
            params = extend( {}, this.oauth_client, {'x_auth_username': username, 'x_auth_password': password } );
        
        ajaxRequest({
            'url' : ssl_host + urls.oauth,
            'type' : "POST",
            'data' : params,
            'success' : function( url_param_string ) {
                var oauth_info = parse_oauth_response( url_param_string );
                if(!oauth_info) {
                    console.log('error during oauth');
                    errors.push({'error' : 'auth', 'data' : url_param_string })
                    oauth_info = { 'error' : 'unknown issue with auth' }
                } else {
                    //
                    self.set_credentials( oauth_info.login, oauth_info.apiKey, oauth_info.access_token );
                }

                
                if(callback) callback( oauth_info );
            }
        });
    
    },
    
    set_domain : function( api_domain ) {
        var types = ["bit.ly", "j.mp"];
        if(types.indexOf(api_domain) > -1 ) {
            this.bit_request.domain = api_domain;
            return true;
        } else {
            this.bit_request.domain = types[0];
        }
        
        return false;
    },
    
    get_domain : function() {
        return this.bit_request.domain;
    },
    
    set_oauth_credentials : function( client_id, client_secret ) {
        this.oauth_client.client_id = client_id;
        this.oauth_client.client_secret = client_secret;
    },
    
    set_credentials : function( login, apiKey, access_token) {
        // set as default
        this.bit_request.login = login;
        this.bit_request.apiKey = apiKey;
        this.bit_request.access_token = access_token;
    },
    
    is_authenticated : function() {
        return (!!(this.bit_request.login && this.bit_request.apiKey && this.bit_request.access_token)) || false;
    },
    
    remove_credentials : function() {
        delete this.bit_request.login;
        delete this.bit_request.apiKey;
        delete this.bit_request.access_token;
    }

}


function extend() {
    var target = arguments[0] || {}, length = arguments.length, i=0, options, name, src, copy;
    for( ; i<length; i++) {
        if( (options = arguments[i] ) !== null) {
            for(name in options) {
                copy = options[ name ];
                if( target === copy ) { continue; }
                if(copy !== undefined ) {
                    target[name] = copy;
                }
            }
        }
    }
    
    return target;
}

function parse_oauth_response( url_string ) {
    //access_token=4bf1cbe01cf1a4806da981c7bf452a28ba2194c6&login=exttestaccount&apiKey=R_0d3f58015f6030b3183d9fbce2f4723b
    var items = ( url_string && typeof url_string === "string" ) && url_string.split("&"),
        response = {}, i=0, params;
    if(!items) {
        if(typeof url_string === "object" && !url_string.length) {
            return url_string;
        }
        return  {'error' : url_string };
    }
    
    for(i=0; i<items.length; i++) {
        params = items[i].split("=");
        response[ (params[0]) ] = params[1]
    }
    
    return response;

}

function is_large_arrary( array ) {
    if( typeof array !== "string" && array.length > 15) { return true; }
    return false;
}

function internal_multiget( api_url, param_key, bit_params, callback ) {
    // props to @jehiah for the above naming convention.
    var collection = [], request_count=0, chunks = [], key_name = "expand";
    
    function stitch( response ) {
        request_count-=1;
        for(var k in response) {
            if(response[k] && response[k].length >= 0) key_name = k
        }
        collection = collection.concat( response[key_name] );
        if(request_count <= 0) {
            var final_respone = {}
            final_respone[key_name] = collection; // required syntax, JS can't turn var into obj keys otherwise
            if(callback) callback( final_respone )
        }
    }
    var urls = bit_params[param_key]
    if( is_large_arrary( urls )  ) {
        chunks = chunk( urls, 15  );
        for(var i=0; i<chunks.length; i++) {
            // break into arrays of length < 15 - bit.ly API has a limit on # per request
            request_count+=1;
            bit_params[ param_key ] = chunks[i];
            bitlyRequest( api_url,  bit_params, stitch);
        }
    } else {
        bitlyRequest( api_url, bit_params, callback);
    }
}

function chunk(array, chunkSize) {
   var base = [], i, size = chunkSize || 5;
   for(i=0; i<array.length; i+=chunkSize ) { base.push( array.slice( i, i+chunkSize ) ); }
   return base;
}


function buildparams( obj ) {
    // todo, handle errors / types better
    var params = [], a, i, len;
    for(var k in obj ) {
        if(obj[k] && obj[k].length > 0 && typeof obj[k] === "object") {
            a = obj[k]; len = a.length;
            for(i=0; i<len; i++) { params[params.length] = k + "=" + encodeURIComponent(a[i]);  }
        } else if( obj[k] ){
            params[params.length] = k + "=" +encodeURIComponent( obj[k] );
        }
    
    }
    return params.join("&");
}

function bitlyRequest( api_url, params, callback, error_callback ) {
    ajaxRequest({
        'url' : api_url,
        'data' : params,
        'success' : function(jo) {
            if(callback) callback( jo );
        },
        error : error_callback || callback
    });
}

function ajaxRequest( obj ) {
    // outside of the ext, this lib needs JSONP
    // 7/25/2010 - for google chrome ext
    var xhr = new XMLHttpRequest(),
        message, ajax_url, post_data=null;
        
    
    if(obj.type === "POST")  {
        ajax_url = obj.url;
        post_data = buildparams( obj.data );
        xhr.open("POST", ajax_url, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
    } else {
        ajax_url = obj.url + "?" + buildparams( obj.data );
        xhr.open("GET", ajax_url, true);
    }
 
    
    xhr.onreadystatechange = function() {
         if (xhr.readyState == 4) {
             // do success
             if(xhr.status === 200) {
                 try {
                      message = JSON.parse(xhr.responseText);
                      if(message.status_code === 200) {
                          message = message.data;
                      } else {
                          // throw error back?
                      }
                  } catch(e) {
                      // NOT JSON
                      message = xhr.responseXML || xhr.responseText
                  }
                  
                  obj.success( message );
             } else {
                 
                 // TODO
                 // handle errors better
                 var err_msg = { 'error' : xhr.responseText || "unknown", 'status_code' : xhr.status }
                 console.log("API invalid response, not 200", obj)
                 if(obj.error) {
                     obj.error( err_msg );
                 }
                 else { obj.success( err_msg ); }
             
             }
         
         }
    }
    xhr.send( post_data || null );
    
    return xhr;

}
    

})();


/*
    Usage
    
    
    var bitly = bitlyAPI(client_id, client_secret)
    bitly.shorten( "http://some.com/url/whatever", func_callback  )
*/

