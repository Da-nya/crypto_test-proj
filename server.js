const http = require('http');
const fs = require('fs');
const server = http.createServer();

server.on('request', (request, response)=>{
    function sendFile(type){
        let path = request.url.slice(1);
        let file = fs.readFileSync(path, "utf8");

        response.writeHead(200, {'Content-Type': type});
        response.end(file);
    }
    switch(request.url){
        case '/':
            let index = fs.readFileSync("index.html", "utf8");

            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(index);
            break;
        case '/css/style.css':
            sendFile('text/css');
            break;
        case '/js/script.js':
            sendFile('text/plain');
            break;
        case '/save':
            let data = "";
            request.on("data", chunk => {
                data += chunk;
            });
            request.on("end", () => {
                //сделать криптографию
                let text = JSON.parse(data).text;
                console.log(text);
                response.writeHead(200, {'Content-Type': 'application/json'});
                let link = '';
                response.end(JSON.stringify({link: link}));
            });
            
            break;
        default:
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.end('404 File Not Found');
    }
    
})

server.listen(8080, ()=>{console.log('Server works at localhost:8080')});