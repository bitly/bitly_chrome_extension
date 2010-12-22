var page_links, queried_matches = [],
    timeout_link, expander_visible = false, bit_container_elem, expanded_elements = [], get_more_links_timeout,
    //[-_a-zA-Z0-9][.\?!]?
    fullUriRegex = new RegExp( "^((?:https?://){1}[a-zA-Z0-9]{0,3}\.{0,1}(?:[a-zA-Z0-9]{1,8}\.[a-z]{1,3}\\/[-_a-zA-Z0-9]{2,20}))(?:[.\?!]?)$", "gi"),
    // keep this basic list, to eliminate already known items and save some cyles later
    false_positive_list = ["clp.ly", "seesmic.com", "wh.gov", "brizzly.com", "post.ly", "twitpic.com", 
                            "yfrog.com", "digg.com", "twitgoo.com", "ficly.com", "google.com", "paste.ly",
                            "su.pr", "venmo.com", "blippy.com", "felttip.com", "github.com", "cnt.to",
                            "is.gd", "tinyurl.com", "twurl.nl", "twitter.com", "ow.ly", "mash.to"];


function no_look_domains( url ) {
    // just a simple test to weed out obvious domains
    var test_string="";
    for(var i=0; i<false_positive_list.length; i++) {
            if( url.indexOf( false_positive_list[i] ) > -1 ) {
                return true;
            }
    }
    return false;

}

/*
    the trim method native to a string maybe html5 specific, caution
*/

/*
    http://www.quirksmode.org/blog/archives/2008/01/using_the_assig.html
    http://paste.ly/4Y5
    var x = document.getElementsByTagName('div');
    for (var i=0,div;div=x[i];i++) {
        doSomething(div);
    }

*/

function escaper( string ) {
    return (string && string.replace(/&/mgi, "&amp;").replace(/"/mgi, "&quot;").replace(/'/mgi, "&#39;")
                 .replace(/>/mgi, "&gt;").replace(/</mgi, "&lt;") ) || "";
}

function _id( name ) {
    return document.getElementById( name );
}

function find_short_links() {

    var links = document.querySelectorAll("a:not([href=''])"), 
        href, matches, final_matches=[], 
        url, i=0, elem;
        
    // todo
    // i'm finding my hover
        
    for ( ; elem=links[i]; i++ ) {
        href = elem.getAttribute("href"), type = elem.getAttribute("type") || false
        if(type === "bitly_hover_card" || !href) continue;
        
        if(queried_matches.indexOf( href ) > -1 )  { continue; }

        matches = href.match(fullUriRegex)
        if(!matches) continue;
        
        if( no_look_domains( matches[0] ) ) { continue; }
        final_matches.push(href);
    }    
    return final_matches;
}

function findPos(obj) {
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        } while(obj = obj.offsetParent)
    }
    
    return [curleft, curtop];
}

function brainResponse(jo) {
    //console.log(jo, "the expanded urls");
    
    // start looking for more
    run_find_more_links();
    
    var links =  document.getElementsByTagName("a"), 
        href, bit_key, user_hash, bit_result, 
        possible_keywords = [], matched_results = [],
        body = document.body;
    
    bit_container_elem = document.getElementById("bitly_expanded_container") || document.createElement("div");
    if(!bit_container_elem.id || bit_container_elem.id === "") {
        bit_container_elem.id = "bitly_expanded_container";
        bit_container_elem.addEventListener('mouseover', function(e) {
            clearTimeout(timeout_link);
            expander_visible = true;
            // hmmmmmmmmm
        });
        bit_container_elem.addEventListener('mouseout', closeBitlyUrlExpanderBox);
        bit_container_elem.addEventListener('click', function(e) {
            var clss = e.target.className, link_box = _id("always_for_this_domain"), params = {};
            if(e.target.parentNode === link_box) {
                //bg.add_no_expand_domain( document.location.host );
                e.preventDefault();                
                params = {'action' : 'add_no_expand_domain_and_reload', 'domain_host' : document.location.host }
                chrome.extension.sendRequest(params, function(){} );                
                return;
            }
            if(clss === "bitly_url_expander_box_close") {
                e.stopPropagation();
                e.preventDefault();
                // show box here
                if(!link_box){ return; }
                var setting = link_box.style.display;
                if(setting==="none") {
                    link_box.style.display="block";
                } else {
                    close_container();                    
                }

                return false;
            }
            
            if(clss === "bitly_home_promo") {
                e.preventDefault()
                chrome.extension.sendRequest({'action' : 'open_options' }, open_options_callback );
            }
        });
        
    }


    
    if(jo.total <= 0) return; // bail, no links
    
    var matches_links = find_link_elements_by_response( jo );   
     
    body.appendChild( bit_container_elem );
    
    for(var i=0; i<matches_links.length; i++) {
       
        //expanded_elements.push( matches_links[i].elem )
        // get the relative position of this element so it's not always calculated
        (function( result, elem_num  ) {
            var html = '', el = matches_links[elem_num].elem, 
                // positions = findPos( el ),
                sUrl = escaper(result.short_url),
                lUrl = escaper( result.long_url ), title = escaper( result.title || result.long_url );
            if(!result || result.error) return;
            //el.setAttribute("title", result.long_url)
            html += '<div class="bit_url_expander_box">'
                html += '<div class="bitly_url_clicksbox">';
                    html += '<ul>';
                        html += '<li class="bit_user_clicks_box"><a type="bitly_hover_card" title="'+sUrl+'+ Page" href="'+ sUrl +'+">' + result.user_clicks + '</a></li>';
                        html += '<li>of</li>';
                        html += '<li class="bit_global_clicks_box"><a type="bitly_hover_card" title="http://bit.ly/'+ result.global_hash +'+ Page" href="http://bit.ly/'+ result.global_hash +'+">' + result.global_clicks + "</a></li>";
                    html += '</ul>';
                html += '</div>';
                html += '<div class="bitly_url_infobox">'
                    html += '<h3><a type="bitly_hover_card" title="'+lUrl +'" href="'+ sUrl +'">' + title + '</a></h3>'
                    html += '<p><a type="bitly_hover_card" href="'+ lUrl+'" class="bit_long_link_preview">'+ lUrl +'</a></p>'
                html += '</div>'
                html += '<a type="bitly_hover_card" title="Close" class="bitly_url_expander_box_close" href="#">X</a>';
                html += '<a type="bitly_hover_card" title="bit.ly, a simple URL shortener" class="bitly_home_promo" href="#">bit.ly</a>';  
                html += '<div style="display:none;" id="always_for_this_domain"><a href="">Hide for this domain.</a></div>'              
                html += '<div class="bit_clearer"><hr /></div>'
            html += '</div>'
            
            
            el.addEventListener('mouseover', function(e) {
                clearTimeout(timeout_link);  
                var evt = e;
                positions = findPos( evt.target );
                console.log(evt)
                var left_pos = ( positions[0] > evt.screenX ) ? (evt.screenX-evt.offsetX) : positions[0],
                    top_pos = ( positions[1] + evt.target.offsetHeight );
                bit_container_elem.setAttribute("style", 'display:block; left:'+ left_pos +'px; top:'+ top_pos +'px;'); 
                // set opacity to 0, then stair step it over a period of time?                                             
                bit_container_elem.innerHTML = html;
                
                // let people set this timeout value??!
                set_close_box_timeout( 1100 ); // give the user a moment to grab the box, or hide it
            });
            // todo
            // add bail here, if hover card no activated
            el.addEventListener('mouseout', closeBitlyUrlExpanderBox);
            
            
        })(matches_links[i].bit_result, i);


    }
    
    
 
}

function _draw_bit_card() {
    
}

function close_container() {
    bit_container_elem.style.display="none"; 
    bit_container_elem.innerHTML = "";
}

function closeBitlyUrlExpanderBox(e) {
    set_close_box_timeout( 100 );
}

function set_close_box_timeout( interval ) {
    if(timeout_link){ clearTimeout(timeout_link); }
    timeout_link = setTimeout(function(){
        close_container();
    }, interval);    
}


function find_link_elements_by_response( jo ) {
    var links =  document.getElementsByTagName("a"), 
        href, bit_key, user_hash, 
        bit_result, i=0, elem,
        possible_keywords = [], matched_results = [];
        
    if(jo.total <= 0) return; // bail, no links
        
    //for(var i=0; i<links.length; i++) {
        
    for ( ; elem=links[i];i++ ) {        
        href = elem.getAttribute("href")
        // TODO
            // careful with the continue statements
            // I could use lastindexof("/") and then check my value, 
            // might be faster b/c a split is a regex and has to create an array
        if(!href) continue;
        // bit_keys = href.split("/");        
        // user_hash = bit_keys.pop();
        // 
        // // note, this could miss keywords and other values, we'll pick those up via possible_keywords
        // if(!user_hash) continue;
        try{
            bit_result = jo.expand_and_meta[ href ]            
        } catch(e){}

        
        if(!bit_result) {
            possible_keywords.push( links[i] )
            continue;
        } else {
            matched_results.push( {'elem' : links[i], 'bit_result' : bit_result } )
        }
    }
    
    for(var i=0; i<possible_keywords.length; i++) {
        href = possible_keywords[i].getAttribute("href");
        var bit_obj = jo.expand_and_meta;
        for(var k in bit_obj) {
            if(bit_obj[k].short_url === href) {
                matched_results.push(  {'elem' : links[i], 'bit_result' : bit_obj }  )
                break;
            }
        }
    }    

    return matched_results;
    
    /// loop over the possible keywords
      
}

function run_find_more_links() {
    
    //return;
    
    if(get_more_links_timeout) {
        clearTimeout(get_more_links_timeout);
        get_more_links_timeout = null;
    }
    
    get_more_links_timeout = setTimeout(function() {
        
        var matches = find_short_links();
        queried_matches = queried_matches.concat( matches );        
        callBrain(matches)
        
    }, 5500)
}

function callBrain( final_matches ) {
    if(final_matches.length > 0) {
        chrome.extension.sendRequest({'action' : 'expand_and_meta', 'short_url' : final_matches }, brainResponse);
    } else {
        run_find_more_links();
    }
    
    return;
}
function open_options_callback() {
    
}


function init() {
    //console.log("searching for short links...")
    var matches = find_short_links();   
    queried_matches = queried_matches.concat( matches );
    // close the box, don't let it get stuc
    document.body.addEventListener('click', closeBitlyUrlExpanderBox);
    callBrain( matches );

}
// hi there, look for short urls
init();

