CREATE DATABASE rudakov_secret;

CREATE TABLE secret_data(
    id VARCHAR UNIQUE,
    secret_text VARCHAR
);