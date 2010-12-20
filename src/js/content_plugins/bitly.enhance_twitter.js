// 
//  bitly.enhance_twitter.js
//  bitly_chrome_extension
//  
//  Created by gregory tomlinson on 2010-11-22.
//  http://www.youtube.com/watch?v=Vxq9yj2pVWk
// 


var active_tweet_boxes, link_set=[], bit_shorten_button;

function check_twitter_text_input( target_elem  ) {

    // climb up and find "tweet-box", see if my bit_shorten is within this parent

    var txt_string=target_elem.value, matches = match_long_links( txt_string );
    // var tweetboxs=active_tweet_box;

    if(matches) {
        console.log("matches - yey!", matches);
        var buttons = document.getElementsByClassName("tweet-button"), lnk, p;
        if(!bit_shorten_button) {
            bit_shorten_button=true;
            lnk = document.createElement("a");
            lnk.innerHTML="Shorten";
            lnk.setAttribute("href", "#");
            lnk.className="button";
            lnk.setAttribute("style", "font-weight: 300; font-size: 15px; padding: 6px 9px; margin-right:5px;");
            // add an event too... 
            // send the actual string
            
            p  = buttons[0].parentNode;
            bit_shorten_button = p.insertBefore( lnk, buttons[0] );
            bit_shorten_button.addEventListener("click", shorten_links_click_event);
        }
    }    
}


function match_long_links( txt_string  ) {
    var regex_pattern = "(http(?:s)?:\/\/(?:[^/]){1,}?\.(?:[^/]{2,})/(?:[^ ]){1,})",
        regex = new RegExp( regex_pattern, "gmi" ), matches;
    
    return txt_string.match( regex );
        
}

// utility
function get_tweet_box() {
    return document.getElementsByClassName("twitter-anywhere-tweet-box-editor")
}

function init() {
     // attach to twitter box... 
     // let's listen to the dom for a focus event... 
     console.log("start enhance")
     window.addEventListener("focus", function(e) {
         console.log("focusing..." ,e )
     });
    if(!active_tweet_boxes) { 
        add_box_events( get_tweet_box() )
    }    
}

function funky_time() {
    //console.log("round trip");
    var boxes = get_tweet_box();
    active_tweet_boxes=boxes;
    if(!active_tweet_boxes) {

        console.log("hrm, bail");
        return;        
    }
    add_box_events( boxes );

}
function add_box_events( boxes ) {
    active_tweet_boxes=box;    
    for(var i=0,box; box=boxes[i];i++) {
        
        //box.removeEventListener("focus", enhance_focus_listen_event);
        box.addEventListener("focus", enhance_focus_listen_event);

        //box.removeEventListener("keypress", enhance_keypress_listen_event);    
        box.addEventListener("keypress", enhance_keypress_listen_event);        
    }    
}

function enhance_keypress_listen_event(e) {
    console.log("type type", e);
    var evt = e, key_code = e.keyCode;
    if(key_code !== 13 && key_code !== 32) {
        // this is just a regular type event...
        return;
    }
    setTimeout(function(){
        check_twitter_text_input( evt.target )
    }, 10);    
}
function enhance_focus_listen_event(e) {
        console.log("focus box");    
}
function shorten_links_click_event( e ) {
    // okay, grab the box
    e.preventDefault();
    console.log("okay, shorten all matches");
    var final_matches=[], boxes=get_tweet_box(), tmp_match;
    for(var i=0,box; box=boxes[i]; i++) {
        tmp_match = match_long_links( box.value );
        if(tmp_match) {
            final_matches = final_matches.concat( tmp_match );
        }
    }
    if(final_matches) {
        console.log("found matches for: ", final_matches);
        for(var i=0; i<final_matches.length; i++) {
            chrome.extension.sendRequest({'action' : 'shorten', 'long_url' : final_matches[i] }, function( shortern_response ) {          
                // console.log("party tapes", boxes, final_matches);
                console.log("shortern_response", shortern_response);
                process_short_links( boxes, final_matches, shortern_response );
            });            
        }

    }
    
}

function process_short_links(boxes, original_links, short_link_response) {
    console.log("why don't I work????")
    for(var j=0,box; box=boxes[j]; j++) {
        var txt_string = box.value
        for(var i=0; i<original_links.length; i++) {
            if( short_link_response.long_url === original_links[i] ) {
                console.log("got match")
                txt_string=txt_string.replace( original_links[i], short_link_response.url );
            }

        } 
        box.value=txt_string;
    }



    // okay, put the short link where the new link was... 

}

// start it
function main() {
    setTimeout(init,20);    
    setInterval(funky_time, 4000);
}

main();

