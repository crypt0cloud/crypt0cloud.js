var crypt0 = require('./index.js');

let cli = new crypt0.Client("crypt0cloud-demo.appspot.com");

/*
cli.getNodeId()
    .then(function (obj) {
        console.log(obj);
    })
    .catch(function (err) {
        console.log(err);
    });

cli.getCurrentBlock()
    .then(function (obj) {
        console.log(obj);
    })
    .catch(function (err) {
        console.log(err);
    });
*/
let cc = new crypt0.Cloud("crypt0cloud-demo.appspot.com")
let unique = (new Date).getTime().toString();
cc.CreateUser(unique)
    .then(function (obj) {
        console.log(obj);
    })
    .catch(function (err) {
        console.log(err);
    });