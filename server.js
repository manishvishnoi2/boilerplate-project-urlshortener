'use strict';
var express = require('express');

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://mvishnoi:mvishnoi@freecodecamp-esb52.mongodb.net/test?retryWrites=true&w=majority";


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser = require('body-parser');
var dns = require('dns');
app.use(bodyParser.urlencoded({ extended: false }))


app.get('/api/shorturl/new', function (req, response) {
    if (!req.query.url) {
        console.log("Url is not provided")
    }

    dns.lookup(req.query.url, function onLookup(err, address, family) {
        var counterVal = 0;
        var newCounter = 0;
        if (err) console.log("address is not correct")
        else {
            MongoClient.connect(uri, function (err, db) {
                if (err) throw err
                var dbo = db.db("test")
                dbo.collection("counter").findOne({}, function (err, result) {
                    if (err) throw err;
                    counterVal = result.counter
                    console.log("THIS is counterVal " + counterVal)
                    newCounter = counterVal + 1
                    console.log("New value " + newCounter)

                    var newObj = { $set: { counter: newCounter } };
                    dbo.collection("counter").updateOne({ counter: counterVal }, newObj, function (err, res) {
                        if (err) throw err;
                        console.log("1 document updated");
                        var dbo = db.db("test")
                        var myObj = { url: req.query.url, shortUrl: newCounter }
                        dbo.collection("url").insertOne(myObj, function (err, res) {
                            if (err) throw err
                            console.log("Successfully inserted url")
                            console.log({ "URL": req.query.url, "shortUrl": newCounter })
                            db.close()
                        })
                    });
                });
            })
        }
    })
    response.end()
})


app.get('/api/check/:short', function (req, res) {
    let address;
    MongoClient.connect(uri, function (err, db) {
        if (err) throw err
        const dbo = db.db("test")

        var myPromise = () => {
            return new Promise((resolve, reject) => {
                let query = { shortUrl: Number(req.params.short) }
                dbo.collection("url").find(query).toArray(function (err, result) {
                    err ? reject(err) : resolve(result[0])
                })
            })
        }

        var callPromise = async () => {
            var result = await (myPromise())
            if (!result.url.startsWith("http://") || !result.url.startsWith("https://")) result.url = 'http://' + result.url
            console.log(result.url)
            res.writeHead(302, {
                'Location': result.url
            });
            res.end();
            return result
        }

        callPromise().then(function (result) {
            db.close();
        })

    })

})

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
    res.json({ greeting: 'hello API' });
});


app.listen(port, function () {
    console.log('Node.js listening ...');
});
