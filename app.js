var crypt0 = require('./index.js');
var config = require('./config.json');

var cry = new crypt0.Crypto();
config.appkeys.publicKey = cry.Base64Decode(config.appkeys.publicKey_base);
config.appkeys.secretKey = cry.Base64Decode(config.appkeys.secretKey_base);

let cli = new crypt0.Client(config.host);

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

async function group(userkp){
	let group = await cc.CreateGroup("payload",["dosign"],config.appkeys,"localhost:8080")
	console.log(group);

	let signreq = await cc.CreateSigningRequest("reqpayload","dosign",["dosign"], group.Sign,config.appkeys.publicKey, "localhost:8080");
	console.log(signreq);

	let t_to_sign = await cc.GetSigningRequest(signreq.IdVal);
	console.log("to sign");
	console.log(t_to_sign);

	let t_signed = await cc.SignSigningRequest(t_to_sign, userkp);
	console.log("tr signed");
	console.log(t_signed);
}

let cc = new crypt0.Cloud(config.host);
let unique = (new Date).getTime().toString();
cc.CreateUser(unique)
	.then(function (kp) {
		//console.log("user created");
		cc.InsertTransaction("payload", kp, config.appkeys.publicKey)
			.then(function (obj) {
				//console.log("transaction added");
				//console.log(obj);
			})
			.catch(function (err) {
				console.log(err);
			});

		group(kp);
	})
	.catch(function (err) {
		console.log(err);
	});


