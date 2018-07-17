let SteamBot = require('./steamBot');
let apiRequests = new (require('./apiRequests'));

let args = process.argv.slice(2);

let config;

if(args[0]) config = require('./config.'+args[0]+'.js');
else config = require('./config.js');

let accountCredentials = config.account;


let steamBot = new SteamBot(accountCredentials.login, accountCredentials.password, accountCredentials.shared_secret, accountCredentials.identity_secret, accountCredentials.apiKey);

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

function sellItem(id, contextid, price){
	return new Promise((resolve, reject) => {
		apiRequests.sellItem(id, contextid, price, config.gameCode ,steamBot, steamID, (err) => {
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
		await sellAllItems(name);
	}
}

async function sellAllItems(name){
	let price = await getPrice(name);
	console.log(`Selling ${processedInv[name].length} of ${name} for ${price} each.`);

	for(let i=0;i<processedInv[name].length;i++){
		await sellItem(processedInv[name][i].assetid, processedInv[name][i].contextid, price).catch((err)=>{
			console.log(`Couldln't sell one of ${processedInv[name]}. Reason : ${err}`);
		});
		globalItemsSold++;
		console.log(i+1 + '/' + processedInv[name].length + '     (' + globalItemsSold + '/' + numOfItems + ')')
		await sellTimeout();
	}

	return;
}


