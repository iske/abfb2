#!/usr/bin/env python

from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
import threading, urllib, json, socket, time
from base64 import standard_b64encode as b64encode
from http.cookiejar import CookieJar, DefaultCookiePolicy
try: from lxml import etree
except: import xml.etree.ElementTree as etree
from xml.sax.saxutils import escape
import urllib.request
import sqlite3

def get_def(text, host, port):
    #HOST = 'localhost'    # The remote host
    #PORT = 2628         # The same port as used by the server
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    s.sendall((text+'\n').encode())
    data = bytes(0);
    i=0;
    rv = s.recv(1024)
    s.setblocking(0)
    while True:
        i+=1
        data = data + rv
        time.sleep(0.2)
        try: rv = s.recv(1024)
        except:
            print("Read error")
            rv = 0;
            break
        print("received", i)
        if not rv:
            print("recv ends")
            break
    i = 0
    try: s.close()
    except: print("already closed")
    return data

def get_google(req, opener):
#https://translate.google.ru/translate_a/single?client=t&sl=en&tl=ru&hl=ru&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8&otf=1&ssel=0&tsel=0&tk=519171|215131&q=cheap
#http://translate.google.com/translate_a/single?client=Firefox&text=nine&sl=en&tl=ru&hl=ru&ie=UTF-8&oe=UTF-8&multires=1&otf=2&trs=1&ssel=0&tsel=0&sc=1
    baseurl = "http://translate.google.com/translate_a/single?"
    url = baseurl + req
    u = opener.open(url)
    print(url)
    return u.read()

def get_sound(cursor, word, lang='eng'):
    print("Got: ", word, lang)
    cursor.execute('''SELECT packages.path, filename, sounds.idx, SWAC_TEXT, SWAC_LANG, SWAC_SPEAK_NAME, SWAC_HOMOGRAPHIDX FROM sounds INNER JOIN packages ON sounds.packages_idx = packages.idx WHERE SWAC_TEXT=? AND SWAC_LANG=? ORDER BY SWAC_PRON_INTONATION DESC LIMIT 24;''', (word, lang,))
    res = cursor.fetchone()
    if not res:
        cursor.execute('''SELECT packages.path, filename, sounds.idx, SWAC_TEXT, SWAC_LANG, SWAC_SPEAK_NAME, SWAC_HOMOGRAPHIDX FROM sounds INNER JOIN packages ON sounds.packages_idx = packages.idx WHERE SWAC_TEXT=? AND SWAC_LANG like ? ORDER BY SWAC_PRON_INTONATION DESC LIMIT 24;''', (word, lang+"%",))
    res = cursor.fetchall()
    sres = json.dumps([i[0]+i[1] for i in res])
    print(sres)
    return sres.encode()

class Handler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.opener = urllib.request.build_opener()
        self.opener.addheaders = [('User-agent', 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:17.0) Gecko/20100101 Firefox/17.0'), ('Referer', 'http://www.google.ru/')]
        self.conn = sqlite3.connect('swac.db')
        self.cursor = self.conn.cursor()
        BaseHTTPRequestHandler.__init__(self, *args, **kwargs)
        
    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-type", "text/plain; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Connection", "close")
        self.end_headers()
        length = int(self.headers['Content-Length'])
        output = json.dumps(("Unknown request",))
        inparam = urllib.parse.parse_qs(self.rfile.read(length).decode('utf-8'))
        print(inparam)
        post_data = json.loads(inparam)
        self.do_smth(post_data)

    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        if self.path.split('?')[0]=="/t":
            self.wfile.write(get_google(self.path.split('?')[1], self.opener))
            if not self.wfile.closed:
                self.wfile.flush()
                self.wfile.close()
            self.rfile.close()
        elif self.path.split('?')[0]=="/sound":
            imparam = urllib.parse.parse_qs(self.path.split('?')[1])
            url = get_sound(self.cursor, imparam['word'][0], imparam['lang'][0])
            self.wfile.write(url)
        else:
            get_data = urllib.parse.parse_qs(self.path.split('?')[1])
            self.do_smth(get_data)

    def do_smth(self, data):
        print(data)
        try: word = data['text'][0]
        except:
            self.wfile.write('{error: no word given}'.encode('utf-8'))
            return
        try: host = data['host'][0]
        except:
            self.wfile.write('{error: no host given}'.encode('utf-8'))
            return
        try: port = int(data['port'][0])
        except:
            self.wfile.write('{error: no port given}'.encode('utf-8'))
            return
        print(host, port, word)
        self.wfile.write(get_def(word, host, port))
        if not self.wfile.closed:
            self.wfile.flush()
            self.wfile.close()
        self.rfile.close()
        return

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle requests in a separate thread."""

 
if __name__ == '__main__':
    server = ThreadedHTTPServer(('0.0.0.0', 8082), Handler)
    print('Starting server, use <Ctrl-C> to stop')
    server.serve_forever()
