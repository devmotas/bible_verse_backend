require('dotenv').config();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors());

const apiUrl = process.env.API_URL;
const tokenUrl = process.env.TOKEN_URL;
let apiToken = process.env.API_TOKEN;

async function fetchRandomVerse() {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                const errorData = await response.json();
                if (response.status === 429 || errorData.msg === "Too many accounts created from this IP, please try again after an hour or login") {
                    await updateToken();
                    attempt = 0;
                } else {
                    throw new Error('Failed to load verse');
                }
            }
        } catch (error) {
            attempt++;
            console.error(`Attempt ${attempt} failed:`, error);

            if (attempt >= maxRetries) {
                console.error('Max retries reached. Could not fetch the verse.');
                throw error;
            }
        }
    }
}

async function updateToken() {
    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: process.env.API_EMAIL,
                password: process.env.API_PASSWORD,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            apiToken = data.token;
        } else {
            throw new Error('Failed to update token');
        }
    } catch (error) {
        console.error('Erro ao atualizar o token:', error);
    }
}

app.get('/verse', async (req, res) => {
    try {
        const verses = [];
        for (let i = 0; i < 10; i++) {
            const verse = await fetchRandomVerse();
            verses.push(verse);
        }
        res.status(200).json(verses);
    } catch (error) {
        res.status(500).send('Failed to fetch verses');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running');
});
