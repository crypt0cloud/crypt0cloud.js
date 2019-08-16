var rp = require('request-promise');
var ed25519 = require('ed25519');

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
}

exports.Client = Client;