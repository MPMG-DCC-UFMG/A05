const express = require('express');
const app = express();
const port = 8000

// Setup static folder
app.use(express.static(__dirname + "/"));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', function (req, res) {
    res.render('index');
});

app.get('/demo', function (req, res) {
    res.render('demo');
});

app.get('/barchart', function (req, res) {
    res.render('barchart');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))