var crypt0 = require('./index.js');

let cli = new crypt0.Client("crypt0cloud-demo.appspot.com");

cli.getNodeId()
    .then(function (obj) {
        console.log(obj);
    })
    .catch(function (err) {
        console.log(err);
    });