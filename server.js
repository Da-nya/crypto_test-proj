const http = require('http');
const fs = require('fs');
const { publicDecrypt } = require('crypto');
let crypto;
try {
     crypto = require('crypto');
  } catch (err) {
    console.log('Модуль Crypto недоступен');
    process.exit(1);
}
const key = crypto.randomBytes(16).toString('hex');

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
                let text = JSON.parse(data).text;
                const encrypted = encrypt(text);

                if (encrypted.length > 65535){
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({result: 'fail', message: 'Строка слишком длинная'}));
                }

                let link = createLink();
                let [hash, iv] = link[1].split('.');

                //сохранить хэш в бд
                response.end(JSON.stringify({result: 'ok', link: link[0] + '.' + iv}));
            });
            
            break;
        default:
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.end('404 File Not Found');
    }
    
})

function encrypt(str, iv = null){
    iv = iv || crypto.randomBytes(8).toString('hex');
    const cipher = crypto.createCipheriv('aes256', key, iv)
    let encrypted = cipher.update(str, 'utf8', 'hex');

    return encrypted + cipher.final('hex') + '.' + iv;
}
function decrypt(str){
    const [encrypted, iv] = str.split('.');
    const decipher = crypto.createDecipheriv('aes256', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')

    return decrypted + decipher.final('utf8');
}

function createLink(){
    let link = crypto.randomBytes(5).toString('hex');

    return [link, encrypt(link)];
}

server.listen(8080, ()=>{console.log('Server works at localhost:8080')});