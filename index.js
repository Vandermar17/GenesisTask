
const express = require('express');

const bodyParser = require('body-parser');

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const asyncHandler = require('express-async-handler')

const fs = require('fs');

const app = express();

const router = express.Router();

app.use(express.json())

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));
//------------------------------------------------------

let emails = {"emails": []};

const DATA_FILE_NAME = 'data.txt';

fs.access(DATA_FILE_NAME, fs.constants.F_OK, err => {
    if(err){
        writeArray();
    }
});


fs.readFile(DATA_FILE_NAME, (err, data) => {
    if (!err) {
        emails = JSON.parse(data)
    }
});


//------------------------------------------------------

const sendgrid = require('@sendgrid/mail');

const SENDGRID_API_KEY = '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';

const SENDER_EMAIL = 'super.gaponenko2000@gmail.com';

const SUBJECT = 'BTC rate'

sendgrid.setApiKey(SENDGRID_API_KEY);

//------------------------------------------------------


router.get('/rate', asyncHandler(async (req, res, next) => {
    let rate = 0
    try{
         rate = await requestRate();
    }catch(err){
        res.status(400).json();
        return
    }
    res.status(200).json(rate);
}));

router.post('/subscribe', (req, res) => {
    const email = req.body.email;
    const oldEmail = contain(emails.emails, email)
    if (!oldEmail) {
        emails.emails.push(email);
        writeArray();
        res.status(200).json();
    } else {
        res.status(409).json();
    }
});

router.post('/sendEmails', asyncHandler(async (req, res) => {
    const rate = await requestRate();
    for (let i in emails.emails) {
        sendEmail(emails.emails[i], rate);
    }
    res.status(200).json();
}));

app.use('/api', router);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

//-------------------------------------

async function requestRate() {
    const rate = await fetch('https://api.exchangerate.host/latest?base=BTC&symbols=UAH')
        .then(res => res.json())
        .then(data => JSON.parse(JSON.stringify(data)).rates.UAH)
    return parseInt(rate)
}

function contain(array = [], value) {
    if (array.length === 0) {
        return false;
    }
    return array.some((item) => item === value);
}

function writeArray() {
    fs.writeFile(DATA_FILE_NAME, JSON.stringify(emails), err => {
        if (!err) {
            console.log('Written');
        }
    });
}

function sendEmail(email, rate) {
    const msg = {
        to: email,
        from: SENDER_EMAIL,
        subject: SUBJECT,
        text: `1 BTC is ${rate} UAH`,
    }
    sendgrid
        .send(msg)
        .catch((error) => console.error(error))
}

