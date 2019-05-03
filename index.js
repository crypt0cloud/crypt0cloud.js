var rp = require('request-promise');
var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
var sha256 = require("js-sha256").sha256;

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

    async InsertTransaction(payload, userkp, appid){
        let b1 = await this.client.getCurrentBlock();
        let nid = await this.client.getNodeId();

        let t = {
            AppID: this.cry.Base64Encode(appid),
            Signer: this.cry.Base64Encode(userkp.publicKey),
            Payload: payload,
            SignKind: "",
            SignerKinds: [],

            FromNode: nid,
            ToNode: nid,

            Callback: "demo",
            Creation: this.cry.CurrentMilis(),
            BlockSign: b1.Sign,
        };

        await this.client.PostSingleTransaction(t,userkp);

        return t;
    }

    async CreateGroup(payload, kinds, appkeys, callback){
        let nid = await this.client.getNodeId();

        let t = {
            AppID: this.cry.Base64Encode(appkeys.publicKey),
            Payload: payload,
            SignKind: "__NEWCONTRACT",
            SignerKinds: kinds,

            FromNode: nid,
            ToNode: nid,

            Callback: callback,
            Creation: this.cry.CurrentMilis(),
        };
        t.Signer = t.AppID

        await this.client.CreateGroup(t,appkeys);

        return t;
    }

    async CreateSigningRequest(payload, signkind, kinds, parent, apppublickey, callback){
        let nid = await this.client.getNodeId();

        let t = {
            Payload: payload,
            SignKind: signkind,
            SignerKinds: kinds,
            Parent: parent,
            AppID: this.cry.Base64Encode(apppublickey),
            Callback: callback,
            FromNode: nid,
        };

        let ret = await this.client.CreateSigningRequest(t);

        return ret;
    }

    async GetSigningRequest(idval){
        return await this.client.GetSigningRequest(idval);
    }

    async SignSigningRequest(t, userkp){
        let b1 = await this.client.getCurrentBlock();

        t.Signer = this.cry.Base64Encode(userkp.publicKey);
        t.ToNode = t.FromNode;
        t.BlockSign = b1.Sign;

        return await this.client.SignSigningRequest(t,userkp);
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

            rp(options).then(obj => {
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
            rp(urlstring).then(htmlstring => {
                let obj = JSON.parse(htmlstring);
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

exports.Crypto = Crypto;
exports.Client = Client;
exports.Cloud = CryptoCloud;