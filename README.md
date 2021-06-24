# P04 (A05 2020)
Projeto para visualização de dados

## REPOSITÓRIO
Este repositório é divido em dois projetos NodeJS: API (backend) e VIZ (frontend)

Após clonar o repositório, instale as dependências do projeto com o comando:

### `npm install`

em suas respectivas raizes (*/api* e */viz*).

## CONEXÃO COM A BASE DE DADOS (HIVE)

Para API, é necessário criar o arquivo .env em */api/src/*, onde serão colocadas as configurações do usuário do banco de dados (HIVE).

Segue modelo de arquivo .env (o mesmo de .env.example):

>HIVE_USER='USER'<br>
>HIVE_PASS='PASSWORD'

## EXECUÇÃO

Ambos projetos podem ser execuados com:

### `npm start`

e para o VIZ funcionar corretamente é necessário que o API esteja sendo executado.

Para navegar nas visualizações, abra [http://localhost:8000/](http://localhost:8000/) no navegador
