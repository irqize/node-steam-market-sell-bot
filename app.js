let config = require('./config');
let SteamBot = require('./steamBot');
let apiRequests = new (require('./apiRequests'));

let accountCredentials = config.account;

let steamBot = new SteamBot(accountCredentials.login, accountCredentials.password, accountCredentials.shared_secret, accountCredentials.identity_secret, accountCredentials.apiKey);

let itemsToSell = {};

let steamID = null;
let processedInv = null;
let numOfItems = null;

let globalItemsSold = 0;

steamBot.logOn((name, id) => {
	console.log('Account ' + name + ' successfully logged in.')
	steamID = id.getSteamID64();
	steamBot.startTradeOffers(() => {
		steamBot.loadMyInventory(config.gameCode ,(err, res) => {
			if(err){
				console.log(err);
				process.exit();
			}
			processedInvRes = steamBot.processInventory(res);
			processedInv = processedInvRes.inv;
			numOfItems = processedInvRes.numOfItems;

			console.log('There are ' + numOfItems + ' marketable items in inventory.');

			console.log('Successfully downloaded and processed inventory.');

			startSelling();
		});
	})
});


function getPrice(name){
	return new Promise((resolve, reject) => {
		apiRequests.getPrice(name,config.account.currencyCode, (err, price) =>{
			if(err) reject(err);
			resolve(price);
		})
	});
}

function sellItem(id, price){
	return new Promise((resolve, reject) => {
		apiRequests.sellItem(id, 2, price, steamBot, steamID, (err) => {
			if(err) reject(err);
			resolve();
		})
	})
}

function sellTimeout(){
	return new Promise(resolve => {
		setTimeout(resolve, config.sellTimeout);
	}) 
}

async function startSelling() {
	for(name in processedInv){
		let price = null;

		await sellAllItems(name);
	}
}

async function sellAllItems(name){
	let price = await getPrice(name);
	console.log(`Selling of ${processedInv[name].length} ${name} for ${price} each.`);

	for(let i=0;i<processedInv[name].length;i++){
		await sellItem(processedInv[name][i].assetid, price).catch((err)=>{
			console.log(`Couldln't sell one of ${processedInv[name]}. Reason : ${err}`);
		});
		globalItemsSold++;
		console.log(i+1 + '/' + processedInv[name].length + '     (' + globalItemsSold + '/' + numOfItems + ')')
		await sellTimeout();
	}

	return;
}


