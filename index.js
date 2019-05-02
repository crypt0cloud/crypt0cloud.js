var rp = require('request-promise');
var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

var sha256 = require("js-sha256").sha256;

exports.printMsg = function() {
    console.log("This is a message from the demo package");
}

class CryptoCloud{
    constructor(endpoint){
        this.client = new Client(endpoint);
        this.cry = new Crypto();
    }

    async CreateUser(user) {
        let b1 = await this.client.getCurrentBlock();
        let nid = await this.client.getNodeId();

        let kp = this.cry.NewKeypair();

        let t = {
            AppID: this.cry.Base64Encode(kp.publicKey),
            Payload: user,
            SignKind: "NewUser",
            SignerKinds: ["NewUser"],
            FromNode: nid,
            ToNode: nid,

            Callback: "demo",
            Creation: this.cry.CurrentMilis(),
            BlockSign: b1.Sign,
        };
        t.Signer = t.AppID

        await this.client.PostSingleTransaction(t,kp);

        return kp;
    }
}

class Client{
    constructor(edp){
        this._endpoint = edp;
        this.cry = new Crypto();
    }

    getNodeId(){
        if (this._endpoint == ""){
            return null;
        }

        return new Promise(resolve => {
            let urlstring = "https://" + this._endpoint + "/api/v1/node_id";
            rp(urlstring).then(htmlString => {
                let obj = JSON.parse(htmlString)
                resolve(obj);
            })
        });

        return ;
    }

    getCurrentBlock(){
        if (this._endpoint == ""){
            return null;
        }

        return new Promise(resolve => {
            let urlstring = "https://" + this._endpoint + "/api/v1/block/get_lasts";
            rp(urlstring).then(htmlString => {
                let arr = JSON.parse(htmlString)
                resolve(arr[0]);
            })
        });
    }

    PostSingleTransaction(t, keys){
        if (this._endpoint == ""){
            return null;
        }

        t = this.cry.signTransaction(t,keys);

        return new Promise(resolve => {
            let options = {
              method: 'POST',
              uri: "https://" + this._endpoint + "/api/v1/post_single_transaction",
              body: t,
                json:true,
                headers:{
                  'Content-Type': 'application/json'
                },
            };

            console.log(options);

            rp(options).then(obj => {
                console.log(obj);
                resolve(obj);
            })
        });
    }

    CreateGroup(t, keys){
        t = this.cry.signTransaction(t,keys);

        return new Promise(resolve => {
            let options = {
                method: 'POST',
                uri: "https://" + this._endpoint + "/api/v1/create_group",
                body: t,
                json: true
            };

            rp(options).then(obj => {
                resolve(obj);
            })
        });
    }

    CreateSigningRequest(t){
        return new Promise(resolve => {
            let options = {
                method: 'POST',
                uri: "https://" + this._endpoint + "/api/v1/create_signingRequest",
                body: t,
                json: true
            };

            rp(options).then(obj => {
                resolve(obj);
            })
        });
    }
    GetSigningRequest(transactionrequest){
        return new Promise(resolve => {
            let urlstring = "https://" + this._endpoint + "/api/v1/get_signingRequest?id=".concat(transactionrequest.toString());
            rp(urlstring).then(obj => {
                resolve(obj);
            })
        });
    }
    SignSigningRequest(t,keys){
        t = this.cry.signTransaction(t,keys);

        return new Promise(resolve => {
            let options = {
                method: 'POST',
                uri: "https://" + this._endpoint + "/api/v1/sign_signingRequest",
                body: t,
                json: true
            };

            rp(options).then(obj => {
                resolve(obj);
            })
        });
    }
}

class Crypto{
    signTransaction(t, keys){
        let jsonstr = JSON.stringify(t);
        let content = nacl.util.decodeUTF8(jsonstr);
        t.Content = this.Base64Encode(content);

        let hash = sha256.array(content);
        t.Hash = this.Base64Encode(hash)
        t.Sign = this.Base64Encode(nacl.sign.detached(this.Base64Decode(t.Hash), keys.secretKey));

        t.Signer = this.Base64Encode(keys.publicKey);
        return t;
    }
    Base64Encode(bytearray){
        return nacl.util.encodeBase64(bytearray);
    }
    Base64Decode(str){
        return nacl.util.decodeBase64(str)
    }
    NewKeypair(){
        return nacl.sign.keyPair();
    }
    CurrentMilis(){
        return (new Date).getTime();
    }
}

exports.Client = Client;
exports.Cloud = CryptoCloud;