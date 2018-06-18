'use strict';
let steamUser = require('steam-user');
let steamTotp = require('steam-totp');
let request = require('request');
let steamTradeOffers = require('steam-tradeoffers');
let getSteamAPIKey = require('steam-web-api-key');
let steamcommunity = require('steamcommunity');

class steamBot {
    constructor(login, password, shared_secret, identity_secret, apiKey) {
        this.login = login;
        this.password = password;
        this.shared_secret = shared_secret;
        this.identity_secret = identity_secret;
        this.apiKey = apiKey;
    }
    logOn(callback) {
        this.steamUser = new steamUser({ promptSteamGuardCode: false });
        this.steamcommunity = new steamcommunity();
        this.steamUser.logOn({
            accountName: this.login,
            password: this.password,
            twoFactorCode: steamTotp.generateAuthCode(this.shared_secret)
        });
        this.steamUser.on('steamGuard', function (d, c, l) {
            if (l) c(steamTotp.generateAuthCode(this.shared_secret));
        });
        this.steamUser.once('loggedOn', function () {
            this.loggedOn = true;
        });

        let self = this;
        this.steamUser.once('webSession', function (sessionID, cookies) {
            self.name = this.accountInfo.name;
            self.cookies = cookies;
            self.sessionID = sessionID;
           
            self.steamcommunity.setCookies(cookies);

            self.steamcommunity.startConfirmationChecker(5000, self.identity_secret);

            self.jar = request.jar();
            cookies.forEach(name => {
                ((function (cookie) {
                    self.jar.setCookie(request.cookie(cookie), 'https://steamcommunity.com');
                })(name));
            });

            callback(this.accountInfo.name, self.steamUser.steamID);
        });
	}
	startTradeOffers(callback) {

		if(this.apiKey){
			this.tradeOffers = new steamTradeOffers();
            this.tradeOffers.setup({
                sessionID: this.sessionID,
                webCookie: this.cookies,
                APIKey: this.apiKey
			});
			return callback();
		}

        let self = this;
        getSteamAPIKey({ sessionID: this.sessionID, webCookie: this.cookies }, function (err, apiKey) {
            if (err) {
                if(self.apiKey){
                    apiKey = self.apiKey
                }else{
                    console.log(`Can't get api key. ${err}`);
                    process.exit(0);
                }
                
            }


            
            callback();
        });
    }
    
    loadMyInventory(gameCode, callback) {
        this.tradeOffers.loadMyInventory({
            appId: gameCode,
            contextId: 2,
            tradableOnly: false
        }, function (err, inv) {
            callback(err, inv);
        });
    }
    processInventory(apiInv) {
		let inv = {};
		let numOfItems = 0;
        for (let i = 0; i < apiInv.length; i++) {
			let item = apiInv[i];

            if (!item.marketable) continue;
            if (!inv[item.market_hash_name]) {
                inv[item.market_hash_name] = [];
			}
			
			numOfItems++;;
            inv[item.market_hash_name].push({
                assetid: item.id,
                contextid: item.contextid
            });
        }
        return {inv, numOfItems};
    }
    refreshSession(callback){
        this.steamUser.webLogOn();
        let self = this;
        this.steamUser.once('webSession', function (sessionID, cookies) {
            self.cookies = cookies;
            self.sessionID = sessionID;
            self.steamcommunity.setCookies(cookies);
            self.jar = request.jar();
            cookies.forEach(name => {
                ((function (cookie) {
                    self.jar.setCookie(request.cookie(cookie), 'https://steamcommunity.com');
                })(name));
            });

            callback(this.accountInfo.name, self.steamUser.steamID);
        });

    }
    


}

module.exports = steamBot;