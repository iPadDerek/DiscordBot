const Discord = require('discord.js')
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const client = new Discord.Client()

//*******************************Google Sheets API Stuff**************************************************************************
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

var credentials;

fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  credentials = JSON.parse(content);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, receivedMessage, arguments) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, receivedMessage, arguments);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

//**************************************************************************************************************************************************************************
var bot_secret_token;
var spreadsheet_id;

fs.readFile('secret_token.json', (err, content) => {
	if (err) return console.log(`Error opening secret token file: ${err}`);
	bot_secret_token = content.toString();
});

fs.readFile('spreadsheet.json', (err, content) => {
	if (err) return console.log(`Error opening spreadsheet id file: ${err}`);
	spreadsheet_id = content.toString();
});

setTimeout(function()
{
	client.login(bot_secret_token)
}, 300);

client.on('ready', () =>
{
	console.log("Connected as " + client.user.tag)
	console.log("Servers:")
	client.guilds.forEach((guild) =>
	{
		console.log(" - " + guild.name)
		guild.channels.forEach((channel) =>
		{
			console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
		})
	})
	client.user.setActivity("%help | Held together with tape")
	var generalChannel = client.channels.get("518265721008947222")	//BotTest general chat
	var spamChannel = client.channels.get("576678382947794954")	//Spam chat
})

client.on('message', (receivedMessage) =>
{
	if(receivedMessage.author == client.user){ return }
	
	if(receivedMessage.content.startsWith("%"))
	{
		processCommand(receivedMessage)
	}
})


function processCommand(receivedMessage)
{
	let fullCommand = receivedMessage.content.substr(1)
	let splitCommand = fullCommand.split(" ")
	let primaryCommand = splitCommand[0]
	let arguments = splitCommand.slice(1)

	console.log("Arguments: " + arguments)
	console.log(receivedMessage.author.tag + " | " + receivedMessage.channel.name + ": " + receivedMessage)
	console.log("User|Channel: " + receivedMessage.author.tag + " | " + receivedMessage.channel.name)

	if(primaryCommand == "hello")
	{
		helloCommand(receivedMessage)
	}
	else if(primaryCommand == "help")
	{
		helpCommand(receivedMessage)
	}
	else if(primaryCommand == "read")
	{
		authorize(credentials, readCalc, receivedMessage, arguments);
	}
	else if(primaryCommand == "test")
	{
		authorize(credentials, writeCalc, receivedMessage, arguments);
	}
	else if(primaryCommand == "setnick")
	{
		nicknameCommand(arguments, receivedMessage);
	}
	else if(primaryCommand == "nicknames")
	{
		getNicknameCommand(receivedMessage);
	}

}

function helpCommand(arguments, receivedMessage)
{
	receivedMessage.channel.send("Try %format, %hello, %help, %test, %setnick, %nicknames")
}

function formatCommand(arguments, receivedMessage)
{
	receivedMessage.channel.send("Format for FGO DPS Calculator(Must have character first, default in ()): !test servant, NP level(5), cardMod(0), Atk bonus(0), Def bonus(0), NP Dmg bonus(0), Power bonus(0), NP Supereff mod(1), flatdmg add(0), NP upgrade(0), Target Class(Shielder), Enemy Attribute(Earth)\nExample:!test Alexander fou500 ce300 np3 mod30 atk30 def20 nmod20 fd30 str1 c-Saber att-Man")
}


function helloCommand(receivedMessage)
{
	receivedMessage.channel.send("Sup");
}

var namebuff;
function refreshBuff()
{
	fs.readFile('nickname.json', (err, data) =>
	{
		if(err) return err;
		namebuff = data.toString().split("\r\n");
	});
}
refreshBuff();

function getNicknameCommand(receivedMessage)
{
	receivedMessage.channel.send(namebuff);
	refreshBuff();
}

function nicknameCommand(arguments, receivedMessage)
{
	let str = arguments;
	str = str.join(" ");
	str = str.split(" = ");
	let flg = 0;
	let nick = str[0];
	let fullname = str[1];
	

	fs.readFile('nickname.json', (err, data) =>	//Basically, read in existing text file into buffer array, check and see if the given nickname already exists, if so, update, otherwise, add on, and write back to file anew
	{
		if(err) return err;
		namebuff = data.toString().split("\r\n");
		for(var i = 0; i < namebuff.length; i++)
		{
			let spl = namebuff[i].split(" = ");
			if(nick == spl[0])
			{
				spl[1] = fullname;
				namebuff[i] = spl.join(" = ");
				return;
			}
			console.log(i);
		}
		namebuff.push(nick + " = " + fullname);
		console.log("Pushed new nickname");
	});
	setTimeout(function()
	{
		namebuff = namebuff.join("\r\n");
		fs.writeFile('nickname.json', namebuff, (err) =>
		{
			if(err) return err;
			receivedMessage.channel.send("New nickname added");
		});
		setTimeout(function()
		{
			refreshBuff();
		}, 300);
	}, 400);

}
function readCalc(auth, receivedMessage, arguments)
{
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheet_id,
    range: 'Main!H31:H34',
  }, (err, res) => {
    if (err) return console.log(`The API returned an error: ${err}`);
    const rows = res.data.values;
    if (rows.length) {
		let i = 0;
		// Print columns A and E, which correspond to indices 0 and 4.
		rows.map((row) => {
			if(i == 0)
				receivedMessage.channel.send(`Damage: ${row[0]}`);
			else if(i == 1)
				receivedMessage.channel.send(`Star Gen: ${row[0]}`);
			else if(i == 2)
				receivedMessage.channel.send(`NP Gen(Refund): ${row[0]}`);
			else
				receivedMessage.channel.send(`Average Damage: ${row[0]}`);
			i++;
		
		});
    } else {
      console.log('No data found.');
    }
  });	
}

function writeCalc(auth, receivedMessage, arguments)
{
	const sheets = google.sheets({version: 'v4', auth});
	let values = [1, 2, 3, 4, 5];
	let value = [];
	
	if(arguments.length < 1)
	{
		receivedMessage.channel.sent("Invalid argument, no data was sent");
		return;
	}
	else
	{
		let serv = [];
		serv.push(arguments[0]);
		let fou = [990];
		let ce = [0];
		let np = [5];
		let mod = [0];
		let atk = 0;
		let def = 0;
		let added = [];
		let nmod = [0];
		let p = [0];
		let se = [1];
		let fd = [0];
		let str = ["No"];
		let clas = ["Shielder"];
		let att = ["Earth"];
		
		for(var i = 1; i < arguments.length; i++)
		{
			if(arguments[i].startsWith("fou"))
			{
				fou[0] = arguments[i].slice(3);
			}
			else if(arguments[i].startsWith("ce"))
			{
				ce[0] = arguments[i].slice(2);
			}
			else if(arguments[i].startsWith("np"))
			{
				np[0] = arguments[i].slice(2);
			}
			else if(arguments[i].startsWith("mod"))
			{
				mod[0] = arguments[i].slice(3);
			}
			else if(arguments[i].startsWith("atk"))
			{
				atk = arguments[i].slice(3);
			}
			else if(arguments[i].startsWith("def"))
			{
				def = arguments[i].slice(3);
			}
			else if(arguments[i].startsWith("nmod"))
			{
				nmod[0] = arguments[i].slice(4);
			}
			else if(arguments[i].startsWith("p"))
			{
				p[0] = arguments[i].slice(1);
			}
			else if(arguments[i].startsWith("se"))
			{
				se[0] = arguments[i].slice(2);
			}
			else if(arguments[i].startsWith("fd"))
			{
				fd[0] = arguments[i].slice(2);
			}
			else if(arguments[i].startsWith("str"))
			{
				str[0] = "Yes";
			}
			else if(arguments[i].startsWith("c-"))
			{
				clas[0] = arguments[i].slice(2);
			}
			else if(arguments[i].startsWith("att-"))
			{
				att[0] = arguments[i].slice(4);
			}
			else
			{
				serv[0] = serv[0] + " " + arguments[i];
			}
		}
		
		for(var i = 0; i < namebuff.length; i++)
		{

			let spl = namebuff[i].split(" = ");
			//console.log(spl);
			if(serv[0] == spl[0])
			{
				//console.log(serv[0]);
				serv[0] = spl[1];
				//console.log(serv[1]);
			}
		}
		refreshBuff();
		added.push(parseInt(atk) + parseInt(def));
		
		
		for(var i = 0; i < arguments.length; i++)
		{
			value.push(arguments[i]);
			//value.push(parseInt(arguments[i], 10));
		}
		const resource = { value, };
		console.log(value);
		
		//6 writes: D4(serv), I4:K4(np, str), D10:D20(mod, mod, mod, 0, 0, added, p, fd, 0, nmod, s), F26:F28(clas, clas, clas), J26:J28(att, att, att), K8:K9(fou, ce)
		//1 read: H31:H34, labeled
		
		sheets.spreadsheets.values.update({	//D10:D20
			spreadsheetId: spreadsheet_id,	//spreadsheetId
			range: 'Main!D10:D20',	//range
			valueInputOption: 'USER_ENTERED',	//valueInputOption
			resource:{
				range: 'Main!D10:D20',
				//majorDimension: 'COLUMNS',
				values:[ mod, mod, mod, [0], [0], added, p, fd, [0], nmod, se ]
			}	//resource
		}, (err, result) => {
			if(err) {
				console.log(err);
				receivedMessage.channel.send("An error occured in the spreadsheet, @ the bot owner to check the log and fix");
				return;
			} 
			else{
				//console.log("Sucessful double write");
				//receivedMessage.channel.send("Wrote %d to spreadsheet", value);
			}
			});	
		sheets.spreadsheets.values.update({	//F26:F28
			spreadsheetId: spreadsheet_id,	//spreadsheetId
			range: 'Main!F26:F28',	//range
			valueInputOption: 'USER_ENTERED',	//valueInputOption
			resource:{
				range: 'Main!F26:F28',
				//majorDimension: 'COLUMNS',
				values:[ clas, clas, clas ]
			}	//resource
		}, (err, result) => {
			if(err) {
				console.log(err);
				receivedMessage.channel.send("An error occured in the spreadsheet, @ the bot owner to check the log and fix");
				return;
			} 
			else{
				//console.log("Sucessful double write");
				//receivedMessage.channel.send("Wrote %d to spreadsheet", value);
			}
			});	
		sheets.spreadsheets.values.update({	//J26:J28
			spreadsheetId: spreadsheet_id,	//spreadsheetId
			range: 'Main!J26:J28',	//range
			valueInputOption: 'USER_ENTERED',	//valueInputOption
			resource:{
				range: 'Main!J26:J28',
				//majorDimension: 'COLUMNS',
				values:[ att, att, att ]
			}	//resource
		}, (err, result) => {
			if(err) {
				console.log(err);
				receivedMessage.channel.send("An error occured in the spreadsheet, @ the bot owner to check the log and fix");
				return;
			} 
			else{
				//console.log("Sucessful double write");
				//receivedMessage.channel.send("Wrote %d to spreadsheet", value);
			}
			});	
		sheets.spreadsheets.values.update({	//K8:K9
			spreadsheetId: spreadsheet_id,	//spreadsheetId
			range: 'Main!K8:K9',	//range
			valueInputOption: 'USER_ENTERED',	//valueInputOption
			resource:{
				range: 'Main!K8:K9',
				//majorDimension: 'COLUMNS',
				values:[ fou, ce ]
			}	//resource
		}, (err, result) => {
			if(err) {
				console.log(err);
				receivedMessage.channel.send("An error occured in the spreadsheet, @ the bot owner to check the log and fix");
				return;
			} 
			else{
				//console.log("Sucessful double write");
				//receivedMessage.channel.send("Wrote %d to spreadsheet", value);
			}
			});	
		sheets.spreadsheets.values.update({	//D4
			spreadsheetId: spreadsheet_id,	//spreadsheetId
			range: 'Main!D4',	//range
			valueInputOption: 'USER_ENTERED',	//valueInputOption
			resource:{
				range: 'Main!D4',
				//majorDimension: 'COLUMNS',
				values:[ serv, ]
			}	//resource
		}, (err, result) => {
			if(err) {
				console.log(err);
				receivedMessage.channel.send("An error occured in the spreadsheet, @ the bot owner to check the log and fix");
				return;
			} 
			else{
				//console.log("Success");
			}
			});	
		sheets.spreadsheets.values.update({	//I4:K4
			spreadsheetId: spreadsheet_id,	//spreadsheetId
			range: 'Main!I4:K4',	//range
			valueInputOption: 'USER_ENTERED',	//valueInputOption
			resource:{
				range: 'Main!I4:K4',
				majorDimension: 'COLUMNS',
				values:[ np, ["NP Upgrade?"], str ]
			}	//resource
		}, (err, result) => {
			if(err) {
				console.log(err);
				receivedMessage.channel.send("An error occured in the spreadsheet, @ the bot owner to check the log and fix");
				return;
			} 
			else{
				//console.log("Sucessful double write");
				//receivedMessage.channel.send("Wrote %d to spreadsheet", value);
			}
			});	
			
		setTimeout(function()
		{
			sheets.spreadsheets.values.get({	//H31:H34
				spreadsheetId: spreadsheet_id,
				range: 'Main!H31:H34',
			}, (err, res) => {
				if (err)
				{
					receivedMessage.channel.send("An error occured reading the results. This really shouldn't happen unless the bot owner's internet is down or something. You should @ them to fix");
					return console.log('The API returned an error: ' + err);
				}
				const rows = res.data.values;
				if (rows.length) {
					let i = [];
				  //console.log('H31:H34');
				  // Print columns A and E, which correspond to indices 0 and 4.
				  rows.map((row) => {
					i.push(row[0]);
					
					/*if(i == 0)
						receivedMessage.channel.send(`Damage: ${row[0]}`);
					else if(i == 1)
						receivedMessage.channel.send(`Star Gen: ${row[0]}`);
					else if(i == 2)
						receivedMessage.channel.send(`NP Gen(Refund): ${row[0]}`);
					else
						receivedMessage.channel.send(`Average Damage: ${row[0]}`);
					i++;
					*/
				  });
				  receivedMessage.channel.send(`Damage: ${i[0]} \nStar Gen: ${i[1]} \nNP Gen(Refund): ${i[2]} \nAverage Damage: ${i[3]}`);
				} else {
				  console.log('No data found.');
				}
			});
		}, 500);
	}
}


const response = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

response.question('', (answer) => {
	response.close();
	process.exit();
});

process.on('unhandledRejection', error => {
	console.log('unhandledRejected: ', error.message);
	process.exit(1);
});

process.on('uncaughtException', (err, origin) => { 
	console.log(`Caught: ${err}\n` + `From: ${origin}\n`);
	console.log('Caught: ' + err + '\nFrom: ' + origin);
	process.exit(1);
});

process.on('ERR_UNHANDLED_ERROR', (err, origin) => {
	console.log(`Caught: ${err}\n` + `From: ${origin}\n`);
	console.log('Caught: ' + err + '\nFrom: ' + origin);
	process.exit(1);
});
