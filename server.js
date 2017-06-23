var http = require("http");
var util = require('util');
var execSync = require('child_process').execSync;
var url = require("url");
var shellescape = require('shell-escape');
var sanitize = require("sanitize-filename");
var fs = require('fs');


function onRequest(request, response) {
 var params = url.parse(request.url,true).query;
 if (params.query == null || params.fname == null) {
 //no get params submitted - display start page
        response.writeHead(200, {'Content-Type': 'text/html'});    
        response.end(startpage());
    } else { 
        //sanitize user input
        var query = shellescape([params.query]);
        var fname = sanitize(params.fname);
        
        //input validation for maximum size parameter
        if (0 < params.msize && params.msize < 1000 && !isNaN(params.msize)) {
        var msize = Math.ceil(params.msize);
        }else {
        var msize = 10;    
        }
        

        //prepare the command and execute it
        var command = "--limit-bytes " + msize + "000000 " + query + " -w /data/traces/" + fname;
        execSync("/usr/bin/stenoread " + command, console.log);

        //build the full filename for output
        var filename = "/data/traces/" + fname;

        //oops - file doesn't exist
        fs.exists(filename, function (exists) {
            if (!exists) {
                console.log('404 File Not Found: ' + filename);
                response.writeHead(404, {"Content-Type": "text/plain"});
                response.write("404 Not Found\n");
                response.end();
                return;
            } else {
        //file found - lets start the download
                console.log('Starting download: ' + filename);
                var stat = fs.statSync(filename);

                response.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                "Content-Disposition" : "attachment; filename=" + fname,
                'Content-Length': stat.size
                });

                var stream = fs.createReadStream(filename, { bufferSize: 64 * 1024 });
                stream.pipe(response);
            }
        });
    }
}

function startpage (){
var timestamp = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '');
var startpagecode = `
<!doctype html>
<html>
<head>
<title>Query Stenoread</title>
</head>
<body>
<pre>
Query Stenoread

Examples:
host 8.8.8.8          		# Single IP address (hostnames not allowed)
net 10.0.0.0/8        		# Network with CIDR
port 23               		# Port number (UDP or TCP)
icmp                 		# Specific protocol
before 2012-11-03T11:05:00Z	# Packets before a specific time (UTC)
after 2012-11-03T11:05:00-0700	# Packets after a specific time (with TZ)
before 45m ago			# Packets before a relative time
after 3h ago         		# Packets after a relative time

Combined filter example:
after 5h ago and before 1h ago and (tcp port 443 or tcp port 80)
<pre>
<form action='/pcap/' method='GET'>
Steno Query: <input type='text' name='query' size=80  value="after 5m ago and tcp"/>
Output Name: <input id='fname' type='text' name='fname' size=40 value="trace-`+ timestamp + `Z.pcap" onfocus="script:clearInterval(refresh);"/> (Output timestamp in UTC)
Max Size:    <input type='number' name='msize' min="1" max="999" maxlength = "3" value="10"/> MB (1-999)
<input type='submit' name='submit' value='Grab!' />
<p id="demo"></p>
</form>

<script language="javascript" type="text/javascript">
var refresh = setInterval(reloadDate, 1000);
function reloadDate() {
    var element = document.getElementById('fname'); 
    if (element != null) {
        var timestamp = new Date().toISOString().replace(/T/, '-').replace(/.....$/, ''); //regex parser not correctly working for browser - wtf
        element.value = "trace-"+ timestamp + "Z.pcap";
    }
}
</script>

</body>
</html>
`
return startpagecode;
};

http.createServer(onRequest).listen(5602,"127.0.0.1");
