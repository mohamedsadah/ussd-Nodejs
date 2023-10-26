import express from 'express';
import axios from 'axios';

export const app = express();
export const port = 3000;

app.use(express.json());

app.post('/ussd', async (req, res) => {
  // Get the request parameters
  const sessionId = req.body.sessionId;
  const serviceCode = req.body.serviceCode;
  const phoneNumber = req.body.phoneNumber;
  const text = req.body.text;

  async function makeTransfer(phone, recipient, amount) {
    const apiUrl = 'https://1682-196-216-220-211.ngrok-free.app/api/transfer?display=SMS';
  
    // Prepare the request body
    const data = {
      phone,
      recipient,
      amount,
    };
  
    // Make the request
    const response = await axios.post(apiUrl, data);
  
    // Check the response status code
    if (response.status !== 200) {
      throw new Error('Transfer failed: ' + response.statusText);
    }
  
    // Return the response data
    return response.data;
  }
  
  async function fetchTokenBalances(phoneNumber) {
    const url = 'https://mocha-api.vercel.app/api/balance?phone=$phoneNumber&display=SMS';
  
    // Make the request
    const response = await axios.get(url);
  
    // Check the response status code
    if (response.status !== 200) {
      throw new Error('Failed to fetch token balances: ' + response.statusText);
    }
  
    // Return the response data
    return response.data;
  }
  
  function validatePhoneNumber(phoneNumber) {
    // Check if the phone number is exactly 9 digits.
    return (phoneNumber.length === 11 && /^\d+$/.test(phoneNumber));
  }
  
  function validateAmount(amount) {
    // Check if the amount is numeric and greater than zero.
    return (Number.isFinite(amount) && amount > 0);
  }
 

  

  // Construct the response
  let response = '';

  // If the text is empty, send the welcome message
  if (text === '') {
    response = 'CON Welcome to Mocha \n';
    response += '1. Check Balance \n';
    response += '2. Check Wallet Address \n';
    response += '3. Make a Transfer \n';
  }

  // If the text is 1, fetch the token balances and send them to the user
  else if (text === '1') {
    // Fetch the token balances
    const tokenBalances = await fetchTokenBalances(phoneNumber);

    // Construct the response
    response = 'END Your request is successful. You will receive a confirmation by SMS \n';
    tokenBalances.forEach(balance => {
      response += `${balance.symbol}: ${balance.amount}\n`;
    });
  }

  // If the text is 2, fetch the wallet address and send it to the user
  else if (text === '2') {
    // Fetch the wallet address
    const walletAddress = await fetchWalletAddress(phoneNumber);

    // Construct the response
    response = 'END Your wallet address is: ' + walletAddress;
  }

  // If the text is 3, start the process of making a transfer
  else if (text === '3') {
    response = 'CON Enter Recipient\'s Phone Number:\n';
  } else if (text.startsWith('3*')) {
    // The user is in the process of making a transfer
    const input = text.split('*');

    if (input.length === 2) {
      // The user entered the recipient's phone number
      if (validatePhoneNumber(input[1])) {
        response = 'CON Enter Amount to Send:\n';
      } else {
        response = 'END Invalid recipient phone number. Please try again.';
      }
    } else if (input.length === 3) {
      // The user entered the amount
      if (validateAmount(input[2])) {
        response = 'CON Confirm Transfer of ' + input[2] + ' to ' + input[1] + '?\n';
        response += '1. Yes\n';
        response += '2. No\n';
      } else {
        response = 'END Invalid amount. Please try again.';
      }
    } else if (input.length === 4) {
      // The user confirmed the transfer
      if (input[3] === '1') {
        // Make the transfer
        const transferSuccess = await makeTransfer(phoneNumber, input[1], input[2]);

        // Construct the response
        if (transferSuccess) {
          response = 'END Transfer Success, you\'ll recieve a confirmation by sms';
        } else {
          response = 'END An error occurred while making the transfer. Please try again later.';
        }
      } else {
        response = 'END Transfer Cancelled. Thank you for using Mochha.';
      }
    }
  }

  // Send the response back to the USSD API
    res.set('Content-Type', 'text/plain');

  res.send(response);
});
app.get('/', (req, res) => {
    // Handle the GET request to the root URL, you can send a welcome message or do something else here
    res.send('Welcome to Mocha USSD service.');
  });

await app.listen(port);
console.log('Server is listening on port ' + port);





