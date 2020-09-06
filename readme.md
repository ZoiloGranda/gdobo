## Warning
To avoid the unintentional lost of files, copy the directory you want to upload/sync and work on that folder if possible. This script removes files when using the sync operations, it asks for confirmation before deleting files.

## Usage

1. Enable the Drive API
https://developers.google.com/drive/api/v3/quickstart/nodejs

2. Select **Desktop App**. In the resulting dialog click **DOWNLOAD CLIENT CONFIGURATION** and save the file `credentials.json` to your application directory.

3. `npm install`

4. `npm start` To see the list of available options

5. Select `CONFIG` option to generate the **config.json** file the first time the app runs

6. The first time you run the app, it will prompt you to authorize access.
 
 Browse to the provided URL in your web browser.
 
 If you are not already logged into your Google account, you will be prompted to log in. If you are logged into multiple Google accounts, you will be asked to select one account to use for the authorization.
 
 Click the **Accept** button.
 
 Copy the code you're given, paste it into the command-line prompt, and press **Enter**.

7. Verify that the file **token.json** was created on the root directory on the application and it has valid data