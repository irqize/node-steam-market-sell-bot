module.exports = {
	account : {
		login : "",
		password : "",
		shared_secret : "",   //You need to activate 2FA authentication to sell items on community market. You can do this using this script : https://github.com/irqize/node-steam-activate-2fa
		identity_secret : "",
		apiKey : "", // if not specified script will try to generate one,
		currencyCode : 1 // code for currency used on account, codes can be found here https://github.com/SteamRE/SteamKit/blob/master/Resources/SteamLanguage/enums.steamd#L856
	},
	useLowestPrices : true,    //true for lowest prices false for median,
	sellTimeout : 3000,
	gameCode : 730 //AppID of game on Steam, can be checked for example here https://steamdb.info/ (730 for CS:GO)
	
};