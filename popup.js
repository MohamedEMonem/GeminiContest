document.addEventListener('DOMContentLoaded', async () => {
    chrome.storage.local.get('factCheckText', async (data) => {
        const text = data.factCheckText;
        if (text) {
            try {
                await factCheckText(text);
            } catch (error) {
                console.error('Error during fact checking:', error);
                document.getElementById('result').innerText = 'Error during fact checking. Please try again later.';
            }
        } else {
            console.error('No factCheckText found in chrome.storage.local');
            document.getElementById('result').innerText = 'No fact to check.';
        }
    });
});


async function loadEnvConfig() {
    try {
        const response = await fetch('.env');
        const text = await response.text();
        const config = {};
        text.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                config[key.trim()] = value.trim().replace(/["']/g, '');
            }
        });
        return config;
    } catch (error) {
        console.error('Error loading .env file:', error);
        return {};
    }
}

async function factCheckText(text) {
    const config = await loadEnvConfig();
    const apiKey = config.APIKEY;
    const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    try {
        const factCheckResponse = await fetch(geminiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `Fact-check the following statement using google search by only responding with less than 300 characters: ${text}` }]
                    }
                ]
            })
        });

        console.log('factCheckResponse:', factCheckResponse);

        if (!factCheckResponse.ok) {
            throw new Error(`HTTP error! Status: ${factCheckResponse.status}`);
        }

        const factCheckData = await factCheckResponse.json();

        console.log('factCheckData:', factCheckData);

        // Get references to the loader and result elements
        const loader = document.querySelector('.loader');
        setTimeout(() => {
            // Hide the loader once the result is updated
            loader.style.display = 'none';
        }, 20); // Replace 2000 with your actual delay or remove if not needed

        // Check if response data structure is as expected
        if (factCheckData.candidates && factCheckData.candidates[0] && factCheckData.candidates[0].content && factCheckData.candidates[0].content.parts && factCheckData.candidates[0].content.parts[0].text) {
            document.getElementById('result').innerText = factCheckData.candidates[0].content.parts[0].text.trim();
        } else {
            console.error('No valid fact-check response received or empty choices array.', factCheckData);
            document.getElementById('result').innerText = 'Unable to retrieve fact-check result.';
        }
    } catch (error) {
        console.error('Error fetching fact-check data:', error);
        document.getElementById('result').innerText = 'Error during fact checking. Please try again later.';
    }


}
