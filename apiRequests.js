
let request = require('request');
let timeout = 30000;
let config = require('./config');

class apiRequests{
    constructor(){

    }
    getPrice(market_hash_name,currency,callback){
        let link = 'https://steamcommunity.com/market/priceoverview/?appid=730&country=PL&currency='+currency+'&market_hash_name='+encodeURIComponent(market_hash_name);
        request.get(link, function (err, res, body) {
			try{
				if(err || !res)return callback(err);
				if(res.statusCode == 429) callback('Request Spam');
				if(res.statusCode != 200) return callback('Response Error'+err?err:res.statusCode);
				res = JSON.parse(body);
				if(!res.success)return callback('Api Error');
				let price = '', apiPrice = null;
				
				if(config.useLowestPrices == false || !res.lowest_price) apiPrice = res.median_price;
				else apiPrice = res.lowest_price;
                
                for(let i=0;i<apiPrice.length;i++){
                    if((apiPrice.charAt(i) >= 0 && apiPrice.charAt(i) <= 9) || apiPrice.charAt(i) == ',' || apiPrice.charAt(i) == '.'){
                        price += apiPrice.charAt(i);
                    }
                }
                
				price = Number(price.replace(',','.'));
	
				callback(null, price);
			}catch(err){
				callback(err);
			}            
        });
    }
    sellItem(assetID, contextID, price, appID, steamBot, steamID, callback){
            if(!price) return callback('No price');

            let link = 'https://steamcommunity.com/market/sellitem/';

            price = Math.floor((Number(price)/1.15 - 0.01)*100);
            let data =
            {
                "sessionid": steamBot.sessionID,
                "appid": appID,
                "contextid": contextID+'',
                "assetid": assetID,
                "amount": 1,
                "price": price+''
            }

            var requestCommunity = request.defaults({
                timeout: timeout,
                jar : steamBot.jar
            });


            
            requestCommunity.post({
                url : link,
                form : data,
                headers : {
                    "Accept": "*/*",
                    'Origin': 'https://steamcommunity.com',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.112 Safari/537.36',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Referer': 'https://steamcommunity.com/profiles/'+steamID+'/inventory/',
                    'Accept-Encoding': 'gzip, deflate, br',
					'Accept-Language': 'pl-PL,pl;q=0.8,en-US;q=0.6,en;q=0.4',
					'Host' : 'steamcommunity.com'
                }
            }, function (err, res, body){
                if(err) return callback(err);
                if(!res) return callback('Unknown error');

                if(res.statusCode == 200){
                    return callback(null,body);
                }
                return callback('HTTP Code '+res.statusCode);

            });
            
    }
}

module.exports = apiRequests;