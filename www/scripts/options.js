define(
  ['dict', 'uitouch', 'socket', 'sdstorage'],
  function(dict, uitouch, socket, sdstorage){
    var callbacks = {'got_file':function(){}, 'got_pp':function(){}};
    var opts_brd   = document.getElementById('options');
    var opts_brd_b = document.getElementById('options_block');
    var lbl = document.createElement("label");
    var fnmre = /(.*)?\/(.+)/;
    lbl.style.order = "99";
    opts_brd.textContent = '';
    var toc = document.createElement("div");
    var dtoc = document.createElement("div");
    //var pincher = document.getElementById('pincher').cloneNode(true);
    //pincher.style.order = "100";
    disable_prop(dtoc);
    toc.id = "toc";
    dtoc.appendChild(toc);
    opts_brd_b.appendChild(dtoc);
    opts_brd_b.appendChild(lbl);
    //opts_brd_b.appendChild(pincher);
    var storage = null;// || 
    try { storage = localStorage } catch(e) {console.warn("localStorage not available");}
    var crstorage = null;
    try{ crstorage = chrome.storage.sync;} catch(e) {console.warn("chrome.storage not available");}
    var type;
    var file = {'name':'empty'};
    var filename = '';
    var currentpp = {'page':0, 'percent':0};
    var datas = {
        dict_src: [['google', 'dictd proxy', 'socket'], "Select dictionary source", 'list-item'],
        dict_db: [['!'], "Dict db (! means all)", 'none'],
        lang_f: ['en', "Translate from", 'none'],
        lang_t: ['ru', "Translate to", 'none'],
        socket_host: ['localhost', "dictd host", 'none'],
        socket_port: ['2628', "dictd port", 'none'],
        proxy_host: ['localhost', "proxy host", 'none'],
        proxy_port: ['8082', "proxy port", 'none'],
        dsfile: [[], "Or choose it from list", 'list-item'],
        file: ['',  'Select a book', 'list-item']
    };
    var showdeps = {
        'google':/lang_f|lang_t/,
        'dictd proxy':/socket_host|socket_port|proxy_host|proxy_port|dict_db/,
        'socket':/socket_host|socket_port|dict_db/,
        'excepts':/dsfile|file|dict_src/
    };
    function draw_deps(el){
        if(el.id!='dict_src') return;
        console.log("selected "+el.value);
        var ex = showdeps['excepts'];
        var shows = showdeps[el.value];
        if(el.value==='dictd proxy' || el.value==='socket') {console.log("Getting dbs"); dict.get_dbs(el.value);}
        if(!shows && !ex) return;
        for(var key in datas){
            if(!ex.test(key) && !shows.test(key)) document.getElementById(key).parentNode.style.display = 'none';
            else if (shows.test(key)) document.getElementById(key).parentNode.style.display = 'list-item';
        }
    }
    var hasStorage = (function() {
      try {
        localStorage.setItem('try', 'try');
        localStorage.removeItem('try');
        return true;
        storage = localStorage;
      } catch(e) {
        return false;
      }
      return false;
    }());
    var values = {};
    function check_params(callbacks){
        callbacks[0](callbacks);
    }
    function hasgoogle(callbacks){
        callbacks.splice(0,1);
        var oReq = new XMLHttpRequest({mozSystem: true});
        oReq.addEventListener("error", function(){console.log("g error"); datas['dict_src'][0].splice(datas['dict_src'][0].indexOf('google'),1);
                                                            callbacks[0](callbacks);}, false);
        oReq.addEventListener("abort", function(){console.log("g abrtd"); datas['dict_src'][0].splice(datas['dict_src'][0].indexOf('google'),1);
                                                            callbacks[0](callbacks);}, false);
        oReq.addEventListener("load", function(){callbacks[0](callbacks);}, false);
        try { oReq.open("GET", "http://translate.google.com/?", true); oReq.send(); }
        catch(e) { datas['dict_src'][0].splice(datas['dict_src'][0].indexOf('google'),1); callbacks[0](callbacks); }
    }
    function hassocket(callbacks){
        //var cs = 0, ms = 0;
        callbacks.splice(0,1);
        //try{ cs = chrome.socket } catch(e) { console.warn(e.stack);}
        //try{ ms = navigator.mozTCPSocket} catch(e) { console.warn(e.stack);}
        
        if(socket.check()===null){
            datas['dict_src'][0].splice(datas['dict_src'][0].indexOf('socket'),1);
            //delete datas['socket_host'];
            //delete datas['socket_port'];
        }
        console.log("checked socket");
        callbacks[0](callbacks);
    }
    function disable_prop(_el){
        _el.addEventListener("touchstart", function(e){e.stopPropagation();}, true);
        _el.addEventListener("touchend", function(e){e.stopPropagation();}, true);
        _el.addEventListener("touchmove", function(e){e.stopPropagation();}, true);
    }
    //var winstyle = element.currentStyle || window.getComputedStyle(element, null);
    function create_select(obj, name, elements, key, disp){
        var sel = document.createElement("select");
        var nm  = document.createElement("option");
        var br  = document.createElement("br");
        var sp  = document.createElement("span");
        nm.textContent = name;
        nm.selected = 1;
        nm.disabled = 1;
        sel.appendChild(nm);
        sel.id = key;
        sel.style.width = "80%";
        //<device storage
        if(key==="dict_db"){
            dict.add_callback('got_dbs', function(_txt){add_dbs(sel, nm, _txt);});
            //dict.get_dbs();
        }else if(key==="dsfile"){
            //if (navigator.getDeviceStorage) {
                sel.addEventListener("change", 
                                function (event){
                                    var fnm = event.target.options[event.target.selectedIndex].value;
                                    console.log("Select file changed "+filename);
                                    filename = fnm.replace(fnmre, "$2");
                                    /*var sdcard = navigator.getDeviceStorage('sdcard');
                                    var request = sdcard.get(fnm);
                                    request.onsuccess = function () {  file = this.result;
                                                                       console.log("Got the file: "+filename); 
                                                                       set_opt('last_file', filename);
                                                                       set_opt(filename+"_time", Date.now());
                                                                       callbacks['got_file']();}
                                    request.onerror = function () { console.warn("Unable to get the file: " + this.error); }*/
                                    sdstorage.get(fnm, function (_file) {
                                                                       file = _file;
                                                                       console.log("Got the file: "+filename); 
                                                                       set_opt('last_file', filename);
                                                                       set_opt(filename+"_time", Date.now());
                                                                       callbacks['got_file']();} );
                                }, false);
                sdstorage.parse(sel, obj);
                //try { sdstorage.parse(sel, obj);}
                //catch(e) {console.warn("Parse storage failed, got\n"+e.stack); delete sel; return;}
            //} else { console.log("No navigator.getDeviceStorage api found"); delete datas[key];}
            return sel;
        } 
        sel.addEventListener("change", function(evt){get_config(); draw_deps(evt.target);
                                    console.log("Saving "+sel.id);
                                    set_opt("sel_"+sel.id, evt.target.options[evt.target.selectedIndex].value); }, false);
        //device storage>
        for(var eln in elements){
            var el = document.createElement("option");
            el.textContent = elements[eln];
            el.value = elements[eln];
            sel.appendChild(el);
        }
        disable_prop(sel);
        sp.appendChild(sel);
        sp.style.display=disp;
        obj.appendChild(sp);
        return sel;
    }
    function create_input(obj, name, value, key, disp){
        var sel = document.createElement("label");
        var inp = document.createElement("input");
        var br  = document.createElement("br");
        var sp  = document.createElement("span");
        sp.style.width = "100%";
        sel.textContent = name;
        inp.id = key;
        inp.style.left="4px";
        if(key==="file") {   inp.type = 'file'; //inp.accept="application/epub+zip,text/xml,text/plain";
                             //get_opt(params, function(key, value){console.log(key+"=got="+value); if(value) inp.value = value;},null);
                             inp.addEventListener("change", function (evt){
                                                            var input = evt.target;
                                                            file = evt.target.files[0];
                                                            filename = file.name.replace(fnmre, "$2");
                                                            set_opt('last_file', filename);
                                                            set_opt(filename+"_time", Date.now());
                                                            callbacks['got_file']();}, false );
        } else {
            inp.value = value;
            var params = [];
            params.push(inp.id);
            inp.type = 'text';
            inp.addEventListener("change",
                function(evt){get_config(); var input = evt.target; set_opt(input.id, input.value); 
                              dict.init_params({"dictionary": values["dict_src"], "host": values["socket_host"], "port": parseInt(values["socket_port"]),
                                               "sl": values["lang_f"], "hl": values["lang_t"], "tl": values["lang_t"],
                                               "phost": values['proxy_host'], "pport": values['proxy_port']});
                              dict.get_dbs(values["dict_src"]);}, false);
            get_opt(params, function(key, value){console.log(key+"=got="+value); if(value){ 
                    inp.value = value;
                    try { var evt = new Event('change');}
                    catch (e) { var evt = document.createEvent('Event'); evt.initEvent('change', true, true); }
                    inp.dispatchEvent(evt);
                }
            },null);
        }
        //obj.appendChild(br);
        sp.appendChild(sel);
        disable_prop(inp);
        sp.appendChild(inp);
        sp.style.display=disp;
        obj.appendChild(sp);
    }
    function display(mode){
        //console.log(mode, opts_brd_b.style.display, opts_brd.style.display);
        if(mode==='show')
            //opts_brd.parentNode.display='block';
            if(opts_brd_b.style.display==='none') opts_brd_b.style.display='block';
            else{opts_brd.parentNode.style.display='block';}
        if(mode==='hide')
            //opts_brd.parentNode.display='none';
            if(opts_brd.parentNode.style.display!='none') opts_brd.parentNode.style.display='none';
            else opts_brd_b.style.display='none';
    }
    function get_config(){
        values = {};
        for(var key in datas){
            var elem = document.getElementById(key);
            if(elem){ values[key] = elem.value; }
            else{console.warn("No "+key+" found.");}
        }
        //console.log("Got config: "+JSON.stringify(values));
        dict.init_params({"dictionary": values["dict_src"], "host": values["socket_host"], "port": parseInt(values["socket_port"]), 
                                                            "sl": values["lang_f"], "hl": values["lang_t"], "tl": values["lang_t"],
                                                            "phost": values['proxy_host'], "pport": values['proxy_port']  });
        return values;
    }
    function set_sel_vl(sel){
        console.log("Getting opt for "+sel.id);
        get_opt(["sel_"+sel.id], function(ky, vl){
                //console.log("Got opt for "+sel.id+" -> "+vl+" / "+ky);
                var opts = Array.prototype.slice.call(sel.options);
                //console.log("Got opt for "+sel.id+". opts == "+opts);
                var id = opts.map(function(el){console.log("el.value==="+el.value); return (el.value===vl);}).indexOf(true);
                console.log("Got opt for "+sel.id+" -> "+vl+". id=="+id+" opts=="+opts);
                if(id!=-1) { sel.selectedIndex = id;
                             draw_deps(sel); 
                             get_config(); }
            });
    }
    function makepos(x){
        x = x||0;
        //console.log("makepos, x==", x);
        var re = /.+?\..+?/, result = x;
        if(re.test(x)) result = parseFloat(x);
        else result = parseInt(x);
        if(isNaN(x) && x<0) result = 0;
        return result;
    }
    function get_cr(keys, callback, evt){
        crstorage.get(keys, function(result){
                //console.log("Got "+JSON.stringify(result)+"from storage, keys was "+keys);
                for(var key in result){
                    callback( key, result[key] );//currentpp[ps[key]] = makepos(result[key]);
                    //console.log("Got "+result[key]+" from "+key+"  ."+keys[key]);
                }
                if(evt) callbacks[evt]();//evo.dispatchEvent(evt);
            });
    }
    function get_ls(keys, callback, evt){
        //console.log("Got keys "+keys);
        for(var key in keys){
            //console.log("Got key "+keys[key]);
            callback( keys[key], storage.getItem(keys[key]) );//currentpp[ps[key]] = makepos(storage.getItem(key));
            console.log("Got "+storage.getItem(keys[key])+" from "+key+"  ."+keys[key]);
        }
        if(evt) callbacks[evt]();//evo.dispatchEvent(evt);//got_pp_ev);
    }
    function get_opt(keys, callback, evt){
        if(hasStorage) get_ls(keys, callback, evt);
        else if(crstorage) get_cr(keys, callback, evt);
        else if(evt) callbacks[evt]();//evo.dispatchEvent(evt);
    }
    function set_opt(key, p){
        if(hasStorage) set_ls(key, p);
        else if(crstorage) set_cr(key, p);
    }
    function set_cr(key, p){
        var pair = {};
        pair[key] = p;
        crstorage.set(pair, function(){/*console.log(p+" saved as "+key);*/});
    }
    function set_ls(key, p){
        localStorage.setItem(key, p);
    }
    function fill_params(callbacks){
        var sels = [];
        for(var key in datas){
            type = typeof(datas[key][0]);
            //console.log(type);
            if(type=="object") sels.push(create_select(opts_brd, datas[key][1], datas[key][0], key, datas[key][2]));
            if(type=="string") create_input(opts_brd, datas[key][1], datas[key][0], key, datas[key][2]);
        }
        get_config();
        sels.map(function(sl){set_sel_vl(sl);});
    }
    function add_dbs(sel, _nm, txt){
        console.log("Got dbs");
        var _txt = txt.replace(/\ /g, "_._").replace(/(\s|\0)+/g, "\n").replace(/_\._/g, " ").replace(/\"/g, "");
        var count = parseInt(txt.replace(/\s+/g, " ").replace(/(.*110.+?)(\d*)(.+?databases present.*)/, "$2"));
        var arr = _txt.split("\n").filter(function(el){return el!='';});
        var start = arr.indexOf("250 ok")-2;
        if(isNaN(count) || start<0) { console.warn("No db count or start in "+txt); return; }
        console.log("Going set db1 "+arr);
        console.log("start == "+start+" count == "+count+" arr[start]=="+arr[start]);
        var itms = [];
        Array.prototype.slice.call(sel.options).map(function(el){sel.removeChild(el);});
        sel.appendChild(_nm);
        for(var i = start; i>(start-count) && i>0; i--){
                console.log("Going set db1.1 "+arr[i]);
                var itms = arr[i].split(" ");
                var nm  = document.createElement("option");
                nm.value = itms[0];
                nm.textContent = arr[i].replace(itms[0]+" ", '');
                sel.appendChild(nm);
        }
        console.log("Going set db2");
        sel.addEventListener("change", function(evt){
                            var p = {};
                            p['dict'] = evt.target.options[evt.target.selectedIndex].value;
                            console.log("p=="+p);
                            dict.init_params(p);}, true);
        console.log("Going set db3");
        set_sel_vl(sel);
    }
    function remove_key(key){
        if(storage){
            storage.removeItem(key);
        } else if(crstorage) {
            var keys = [];
            keys.push(key);
            crstorage.remove(keys, function(){console.log(key+" removed");}) 
        }
    }

    function remove_old(items){
        var keys = Object.keys(items);
        var timekeys = keys.filter(function(str){return str.match(/.+?_time/);});
        var time = Date.now()-2592000000;//Month for all
        console.log("time=="+time+" timekeys=="+timekeys+" timeval = "+items[timekeys[0]]);
        var badtimekeys = timekeys.filter(function(key){return items[key] < time});
        var badprefixes = badtimekeys.map(function(item, i, arr){return item.replace(/(.+?)_time/, "$1");});
        if(badprefixes.length==0) return; 
        console.log("badprefixes == "+badprefixes);
        var re = new RegExp("("+badprefixes.join("|")+")_(.+)");
        var badkeys = keys.filter(function(str){return str.match(re);});
        console.log("badkeys == "+badkeys);
        time = Date.now()-259200000;     //3 days for a single page
        badtimekeys = timekeys.filter(function(key){return items[key] < time});
        badprefixes = badtimekeys.map(function(item, i, arr){return item.replace(/(.+?)_time/, "$1");});
        if(badprefixes.length==0) return; 
        console.log("badprefixes == "+badprefixes);
        re = new RegExp("("+badprefixes.join("|")+")_last_html");
        badkeys = badkeys.concat(keys.filter(function(str){return str.match(re);}));
        re = new RegExp(filename+"_(.+?)");
        badkeys = badkeys.filter(function(str){return !str.match(re);});
        badkeys.map(function(item, i, arr){remove_key(item);});
        console.log("badkeys == "+badkeys);
    }

    function get_all_itms(callback){
        if(storage) {
            var items = {}; var i = 0; var key = null;
            for (;key = storage.key(i); i++) items[key] = storage.getItem(key);
            console.log("going remove..");
            callback(items);
            console.log("remove done.");
            return;
        }
        if(crstorage) crstorage.get(null, function(items) {
                callback(items);
        });
    } 
    function savepp(){
        var prckey = filename+"_prc", pnmkey = filename+"_pnm", timekey = filename+"_time";
        set_opt(prckey, currentpp['percent']);
        set_opt(pnmkey, currentpp['page']);
        set_opt(timekey, Date.now());
        console.log("Saved "+prckey+" as "+currentpp['percent']+pnmkey+" as "+currentpp['page']);
    }
    function getpp(){
        currentpp = {'page':0, 'percent':0};
        var prckey = filename+"_prc", pnmkey = filename+"_pnm";
        var ps = {};
        ps[prckey] = 'percent';
        ps[pnmkey] = 'page';
        get_opt(Object.keys(ps), function(key, val){
                currentpp[ps[key]] = makepos(val);
                console.log(key+"=got="+val);
            }, 'got_pp');
    }

    check_params([hasgoogle, hassocket, fill_params]);
        //sp.className = "spflex";

    return{
            display:function(mode){
                display(mode);
            },
            config:function(){
                return values;//get_config();
            },
            bookfile:function(){
                return file;//document.getElementById('file').files[0];
            },
            remove_opt:function(key){
                remove_key(filename+"_"+key);
            },
            set_opt:function(key, val, file){
                var param;
                if(file) param = filename+"_"+key;
                else param = key;
                set_opt(param, val);
            },
            remove_old:function(){
                get_all_itms(remove_old);
            },
            get_opt:function(key, callback, file){
                var ps = [];
                if(file) ps.push(filename+"_"+key);
                else ps.push(key);
                get_opt(ps, function(ky, vl){callback(vl);}, null);
            },
            savepp:function(){
                savepp();
            },
            getpp:function(){
                getpp();
                //callback( key, result[key] );//currentpp[ps[key]] = makepos(result[key]);
            },
            setpercent:function(percent){
                if(isNaN(percent)) currentpp['percent'] = 0;
                else currentpp['percent'] = percent;
                //this.savepp();
                //console.log("set currentpercent=="+percent);
                lbl.textContent = parseInt(percent)+"% of current chapter";
            },
            msg:function(text){
                if(text) lbl.textContent = text;
                else return lbl.textContent;
            },
            getpercent:function(){
                return currentpp['percent'];
            },
            setpage:function(page){
                if(isNaN(page)) currentpp['page'] = 0;
                else currentpp['page'] = page;
                //this.savepp();
                console.log("set currentpage=="+page);
            },
            getpage:function(){
                return currentpp['page'];
            },
            add_callback:function(key, fcn){
                callbacks[key] = fcn;
            },
            filename:function(){
                return filename;
            }
    };
  }
);
