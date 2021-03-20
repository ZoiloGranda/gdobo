#!/usr/bin/env node
/**
* @license
* Copyright Google Inc.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     https://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
// [START drive_quickstart]
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { startProcess } = require('./index')
const open = require('open');
const path = require('path');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly', 'https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(__dirname, '/token.json');
const CREDENTIALS_PATH = path.join(__dirname, '/credentials.json');
// Load client secrets from a local file.
fs.readFile(CREDENTIALS_PATH, (err, content) => {
 if (err) return console.log('Error loading client secret file:', err);
 // Authorize a client with credentials, then call the Google Drive API.
 authorize(JSON.parse(content), startProcess);
});

/**
* Create an OAuth2 client with the given credentials, and then execute the
* given callback function.
* @param {Object} credentials The authorization client credentials.
* @param {function} callback The callback to call with the authorized client.
*/
function authorize(credentials, callback) {
 const { client_secret, client_id, redirect_uris } = credentials.installed;
 const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0]);

 // Check if we have previously stored a token.
 fs.readFile(TOKEN_PATH, (err, token) => {
  if (err) return getAccessToken(oAuth2Client, callback);
  oAuth2Client.setCredentials(JSON.parse(token));
  callback(oAuth2Client);
 });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getAccessToken(oAuth2Client, callback) {
 const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES
 });
 console.log('Authorize this app by visiting this url:', authUrl);
 await open(authUrl);
 const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
 });
 rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oAuth2Client.getToken(code, (err, token) => {
   if (err) return console.error('Error retrieving access token', err);
   oAuth2Client.setCredentials(token);
   // Store the token to disk for later program executions
   fs.writeFileSync(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) return console.error('errorcito', err);
    console.log('Token stored to', TOKEN_PATH);
   });
   callback(oAuth2Client);
  });
 });
}

// [END drive_quickstart]
module.exports = {
 SCOPES
};
