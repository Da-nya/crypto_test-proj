## Тестовое задание "Секрет"

[ТЗ](https://github.com/areal-team/tz/tree/master/secret)

* Проект сделан на NodeJS + VueJS
* База данных - PostgreSQL 14

### Установка 
1. Для начала нужно создать базу данных в соответствии с файлом **db.sql**
    * саму таблицу можно не создавать, она допонительно проверяется/создается сервером
2. Настроить соединение с БД в файле **db_config.js**
3. Установка библиотеки postgress  `npm install`

### Запуск
* `node server.js`

Страница будет доступна по адресу [http://localhost:8080](http://localhost:8080)

P.S. Шифрование плохо работает с кириллицей, латиница и цифры работают
#
##### by Rudakov Daniil