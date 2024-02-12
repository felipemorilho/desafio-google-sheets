const { google } = require('googleapis');
const fs = require('fs');
const { promisify } = require('util');
const readline = require('readline');

const readFileAsync = promisify(fs.readFile);

async function authorize(credentials) {

    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    try {

        const token = await readFileAsync('token.json');
        oAuth2Client.setCredentials(JSON.parse(token));
        return oAuth2Client;

    } catch (err) {

        return getAccessToken(oAuth2Client);

    }
}

async function getAccessToken(oAuth2Client) {

    const authUrl = oAuth2Client.generateAuthUrl({

        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/spreadsheets'],

    });

    console.log('Authorize this app by visiting this url:', authUrl);

    const rl = readline.createInterface({

        input: process.stdin,
        output: process.stdout,

    });

    try {

        const code = await new Promise((resolve) => {
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                resolve(code);
            });

        });

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        fs.writeFile('token.json', JSON.stringify(tokens), (err) => {

            if (err) console.error(err);
            console.log('Token stored to token.json');

        });

        return oAuth2Client;

    } catch (error) {

        console.error('Error getting access token:', error);
        process.exit(1);

    }
}

module.exports = {

    googleAuth: {
        authorize,
    },

    sheets: google.sheets,
    
};
