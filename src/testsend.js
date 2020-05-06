    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    var request = require('request').request;    //mport json

    function myfunction(){

        var xhr = new XMLHttpRequest();
        // var homeResource = "https://lippizzan3.rtpnc.epa.gov/dctm-rest/services"
        // var linkrel = "http://identifiers.emc.com/linkrel/cabinets"
        // repository = "ecmsrmr65"
        // cabinet = "egrs"
        // credentials=('oarm_egrs', 'Happydays11')

        // home = request.get(homeResource)
        // home.raise_for_status()

        xhr.open("GET", "http://example.com/documentum-rest/services", false);
        //xhr.setRequestHeader("Authorization: Basic Happydays11");
        //, user= "oarm_egrs", password= "Happydays11"
        xhr.send();

        console.log(`Loaded: ${xhr.status} ${xhr.response}`);
            
    }
    myfunction()