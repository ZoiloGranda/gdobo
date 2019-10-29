## Warning
Copy the directory you want to upload and work on that folder, this script removes the files after uploading them to avoid duplicated uploads.

### 1
Enable the Drive API
https://developers.google.com/drive/api/v3/quickstart/nodejs

In resulting dialog click DOWNLOAD CLIENT CONFIGURATION and save the file `credentials.json` to your working directory.

### 2
`npm install`

### 3
Create `.env` based on `.env-example`

### 4
`npm start`

### 5
The first time you run the sample, it will prompt you to authorize access:

Browse to the provided URL in your web browser.

If you are not already logged into your Google account, you will be prompted to log in. If you are logged into multiple Google accounts, you will be asked to select one account to use for the authorization.

Click the Accept button.
Copy the code you're given, paste it into the command-line prompt, and press Enter.