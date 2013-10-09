define(
  ['stuff', 'encod', 'socket'],
  function(stuff, encod, socket){
    var resp = '';
    var callbacks = {'got_def':function(){}, 'got_dbs':function(){}}; 
    //var got_def_ev = new Event('got_def');
    var gsocketid = 0;
    var datas = {
        google_base_url: 'http://translate.google.com/translate_a/t?client=Firefox&',
        local_base_url: "http://192.168.0.2:8082/?",//?text=+"value"+"&dict="+"!"+"&host="+"localhost"+"&port="+"2628";
        dictionary: 'google',
        sl: 'en',
        tl: 'ru',
        hl: 'ru',
        ie: 'UTF-8',
        oe: 'UTF-8',
        multires: 1,
        otf: 2,
        trs: 1,
        ssel: 0,
        tsel: 0,
        sc: 1,
        text: 'true',
        dict: "!", //Dictionary for dictd. "!" means all availiable
        host: "192.168.0.2", //Host where is dictd on.
        port: 2628, //Port where is dictd on.
        db: '!' //Dictionary db
    };
    var googles = {text:'',sl:'',tl:'',hl:'',ie:'',oe:'',multires:0,otf:0,trs:0,ssel:0,tsel:0,sc:0};
    var locals  = {text:'',host:'',port:0};
    //var locals_get_str = '';
    /*dreq.open("GET", "http://translate.google.com", true);
    try {dreq.send();}
    catch(e){console.log("XMLHttpRequest failed, got:",e);};*/
    function get_http(_text, params, baseurl, callback){
        var dreq = new XMLHttpRequest();
        dreq.onload = function (event) {
                console.log("XMLHttpRequest done");
                resp = '';
                var resptext = event.target.responseText;
                //console.log(JSON.parse(resptext)["dict"]);
                if(datas["dictionary"]==="google"){
                    var respj = JSON.parse(resptext);
                    if( Object.keys(respj).indexOf("sentences")>-1 ) resp += respj["sentences"][0]["trans"];
                    if( Object.keys(respj).indexOf("dict">-1) )      try{ resp += "<br>"+respj["dict"][0]["terms"].join(", ");}
                    catch(e) {console.warn(e.stack);}
                }
                else resp = resptext;
                //alert("Got "+resp);
                console.log("Got inner response ", resp);
                callback(resp);
            }
        var l_arr = [];
        var params_get_str = '';
        params['text'] = _text;
        for (var key in params){
            l_arr.push(key+"="+params[key]);
        }
        params_get_str = l_arr.join("&");
        var url = baseurl+params_get_str;
        dreq.open("GET", url, "true");
        dreq.send();
        //alert("Request sended, url was "+url+".");
        console.log("Request sended, url was "+url);
    }
    return {
        response:function(){
            if (datas["dictionary"] == 'socket') resp = socket.response();
            return resp;
        }, 
        get_def:function(word){
            lword = word.toLowerCase();
            console.log("lword=="+lword+" dict=="+datas["dictionary"]);
            if(datas["dictionary"] === 'dictd proxy') get_http('DEFINE '+datas["db"]+' '+lword+'\n', locals, datas["local_base_url"], callbacks['got_def']);
            else if (datas["dictionary"] === 'google') get_http(lword, googles, datas["google_base_url"], callbacks['got_def']);
            else if (datas["dictionary"] === 'socket'){
                socket.check();
                socket.init(datas["host"], 2628, datas["db"]);
                //socket.evo.addEventListener('got_def', function (e) { resp = socket.response(); dreq.dispatchEvent(got_def_ev); }, false);
                socket.get_def(lword, callbacks['got_def']);
            } else console.log("No dictionary selected");
        },
        get_dbs:function(){
            if(datas["dictionary"] === 'dictd proxy') get_http("SHOW DATABASES\n", locals, datas["local_base_url"], callbacks['got_dbs']);
            else {
                socket.check();
                console.log("init by ", datas["host"], 2628);
                socket.init(datas["host"], 2628, datas["db"]);
                socket.get_dbs(callbacks['got_dbs']);
            }
        },
        init_params:function(params){
            for (var key in params) datas[key] = (params[key] != null ? params[key] : datas[key]);
            for (var key in googles) googles[key] = datas[key];
            for (var key in locals){
                locals[key] = datas[key];
                //l_arr.push(key+"="+datas[key]);
            }
            //locals_get_str = l_arr.join("&");
        },
        add_callback:function(key, fcn){
            callbacks[key] = fcn;
        }
    };
  }
);
