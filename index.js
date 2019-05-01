var rp = require('request-promise');
var nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

var sha256 = require("js-sha256");

exports.printMsg = function() {
    console.log("This is a message from the demo package");
}

class Client{
    constructor(edp){
        this._endpoint = edp;
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

    getCurrentBlockAsync(){
        if (this._endpoint == ""){
            return null;
        }

        return new Promise(resolve => {
            let urlstring = "https://" + this._endpoint + "/api/v1/block/get_last";
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

        let cry = new Crypto();
        t = cry.signTransaction(t,keys);

        return new Promise(resolve => {
            let urlstring = "https://" + this._endpoint + "/api/v1/post_single_transaction";
            rp(urlstring).then(htmlString => {
                let obj = JSON.parse(htmlString)
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

        t.Hash = this.Base64Encode(sha256(content))
        t.Sign = this.Base64Encode(nacl.sign.detached(content, key.secretKet));

        t.Signer = this.Base64Encode(key.publicKey);
    }
    Base64Encode(plaintext){
        return nacl.util.encodeBase64(plaintext);
    }
}

exports.Client = Client;