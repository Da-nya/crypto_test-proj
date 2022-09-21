const db_config = require('./db_config');

const http = require('http');
const fs = require('fs');

const {Client} = require('pg');
const client = new Client(db_config.pg_settings);
client.connect();

// создается нужная таблица, если она отсутствует
client.query('CREATE TABLE IF NOT EXISTS secret_data(id VARCHAR UNIQUE, secret_text VARCHAR)', (err, res)=>{
    if (!err){
        console.log('Настройка БД успешна');
    }
    else{
        console.error('SQL query -- ' + err.message)
    }
});

let crypto;
try {
     crypto = require('crypto');
  } catch (err) {
    console.log('Модуль Crypto недоступен');
    process.exit(1);
}
const key = '91a33a0b08d8167adcffc9a7f27eca16';
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

                //слишком длинная строка не поместится в бд
                if (encrypted.length > 65535){
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify({result: 'fail', message: 'Строка слишком длинная.'}));
                }

                //функция будет повторно вызываться, если был сгенерирован уже существующий id
                const genLink = ()=>{
                    let link, hash, iv;
                    link = createLink();
                    [hash, iv] = link[1].split('.');
                    saveDataToDb(hash, encrypted).then(res => {
                        if (res){
                            response.writeHead(200, {'Content-Type': 'application/json'});
                            response.end(JSON.stringify({result: 'ok', link: link[0] + '.' + iv}));
                        }
                        else{
                            genLink();
                        }
                    }, () =>{
                        response.writeHead(200, {'Content-Type': 'application/json'});
                        response.end(JSON.stringify({result: 'fail', message: 'Произошла ошибка при сохранении.'}));
                    })
                }
                genLink();
            })
            break;
        default:
            //попробуем расшифровать url для получения контента из бд
            let url = request.url.split('/').pop();
            const [id, iv] = url.split('.');
            if (!(id && iv)){
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end('404 File Not Found');
            }
            const hash = encrypt(id, iv).split('.')[0];
            client.query("SELECT secret_text FROM secret_data WHERE id = '" + hash + "'", (err, res)=>{
                if (err){
                    console.error('SELECT secret_text -- ' + err.message);
                }
                else{
                    if (res.rows.length > 1){
                        console.error('В БД обнаружено нарушение уникальности');
                    }
                    else if (res.rows.length == 1){
                        response.writeHead(200, {'Content-Type': 'text/plain'});
                        response.end(decrypt(res.rows[0].secret_text + '.' + iv));
                        return;
                    }
                }
                response.writeHead(404, {'Content-Type': 'text/plain'});
                response.end('404 File Not Found');
            });
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

// генерируем и шифруем ссылку
function createLink(){
    let link = crypto.randomBytes(5).toString('hex');

    return [link, encrypt(link)];
}

// добавление данных в бд с проверкой на уникальность id
function saveDataToDb(id, text){
    return new Promise((resolve, reject) =>{
        client.query("SELECT id FROM secret_data WHERE id = '" + id + "'", (err, res)=>{
            if (res.rows.length == 0){
                client.query("INSERT INTO secret_data (id, secret_text) VALUES ('" + id + "', '" + text + "')", (err, res)=>{
                    if (err){
                        console.error('INSERT ERROR -- '+ err.message)
                        reject()
                    }
                    resolve(true);
                    
                });
            }
            else{
                console.log('такой id уже существует', id);
                resolve(false)
            }
        });
    });
}

server.listen(8080, ()=>{console.log('Server works at localhost:8080')});