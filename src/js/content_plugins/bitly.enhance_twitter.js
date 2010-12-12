// 
//  bitly.enhance_twitter.js
//  bitly_chrome_extension
//  
//  Created by gregory tomlinson on 2010-11-22.
//  
// 


var avtive_tweet_box, link_set=[];

function check_twitter_text_input() {
    // look for (http(?:s)?:\/\/(?:[^/]){1,}\.(?:[^/]{2,})/(?:[^ ]))
    var regex_pattern = "(http(?:s)?:\/\/(?:[^/]){1,}\.(?:[^/]{2,})/(?:[^ ]){1,})"
    var regex = new RegExp( regex_pattern, "gmi" );
    
    

    console.log("matches", matches )
    
    var tweetboxs = get_tweet_box();
    var matches, txt_string;
    for(var i=0,box; box=tweetboxs[i]; i++) {
        txt_string = box.value
        
        matches  = txt_string.match( regex_pattern );
        
        console.log("matches", matches)
    }
    
}

function get_tweet_box() {
    return document.getElementsByClassName("twitter-anywhere-tweet-box-editor")
}

function check_again() {
    
    setTimeout( function() {
        init();
        
    }, 3000)
}

function init() {
     // attach to twitter box... 
     // let's listen to the dom for a focus event... 
     console.log("start enhance")
     window.addEventListener("focus", function(e) {
         console.log("focusing..." ,e )
     });
     var tweetboxs = get_tweet_box() || [];
     console.log("tweetboxs", tweetboxs)
     
     if(tweetboxs.length <= 0 ) {
         console.log("look again...");
         console.log("set timeout...")
         check_again();
         return;
     }
     
     for(var i=0,box; box=tweetboxs[i]; i++) {
         avtive_tweet_box=box;
         box.addEventListener("focus", function(e) {
             console.log("focus box");
         });
         
         box.addEventListener("keypress", function(e) {
             console.log("type type", e);
             
             setTimeout(check_twitter_text_input, 10);
         });        
     }

     
     
}


// start it
function main() {
    setTimeout(init,20);    
}

main();
