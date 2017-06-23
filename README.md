# stenoread-nodejs

This is a little hack and primitive web interface for [Google Stenographer](https://github.com/google/stenographer) to do [currently unsupported](https://github.com/google/stenographer/blob/master/DESIGN.md#serving-data) remote requests. Running `node server.js` will run a nodejs web server that hosts a web interface that is capable of requesting and downloading raw packet capture from Stenographer. This was designed to be used with the [ROCK NSM](http://rocknsm.io/) platform on an internal network. It can be run on the same server as rocknsm. 

Although basic input sanitization is done, be carefull how you set the permissions for the nodejs process and secure the web interface appropriately. I know that passing on parameters to a shell command might be a bad idea ;-). 

This is the first  prototype - so you were warned.

## Install
In order for this to work you will have to add a selinux exception for the nodejs webserver.
``` sh
semanage port -a -t http_port_t -p tcp 5602
```
The server is only listening on localhost - so you can use nginx to publish/secure the site.
Sample NGINX location block:
```
    location /pcap {
        proxy_pass http://localhost:5602;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
``` 


You will also need to create the folder /data/traces/ which will be used to store the pcap files.
Currently there is no cleaning up in this dir - so you will have to take care of this manually for the moment.
