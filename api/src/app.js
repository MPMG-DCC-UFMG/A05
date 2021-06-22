require('dotenv').config({ path: __dirname + '/.env' })

if (process.env)
  if (!(process.env.HIVE_USER && process.env.HIVE_PASS)) {
    console.log("'HIVE_USER' AND 'HIVE_PASS' WEREN'T SETTINGS IN .env!!!")
    process.exit(1)
  }

const app = require('./config/express')();
const port = app.get('port');

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}.`)
});