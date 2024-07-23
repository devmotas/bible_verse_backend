const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const cors = require('cors'); // Importa o middleware CORS
const express = require('express'); // Usando Express para simplificar

const app = express();
app.use(cors()); // Habilita CORS para todas as rotas

const apiUrl = 'https://www.abibliadigital.com.br/api/verses/nvi/random';
const tokenUrl = 'https://www.abibliadigital.com.br/api/users/token';
let apiToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHIiOiJUdWUgSnVsIDIzIDIwMjQgMTg6Mzg6MjEgR01UKzAwMDAuNjY5ZmVjYjc2NTQwMDgwMDNlMjk4N2NkIiwiaWF0IjoxNzIxNzU5OTAxfQ.JG63PrSGANyj57AKrWlelDrUnhrFpqa4MrRGP2HmchQ';

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
                    attempt = 0; // Reset attempt count after updating token
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
                email: 'devgustavomota@gmail.com',
                password: '123456',
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
    res.send('Server is up and running!');
    try {
        const verse = await fetchRandomVerse();
        res.status(200).json(verse);
    } catch (error) {
        res.status(500).send('Failed to fetch verse');
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running');
});
