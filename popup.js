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
 
async function factCheckText(text) {
  const apiKey = 'AIzaSyDPLtJg_A9eKCR1UAbe_tK-Xroz5It5X6g';
  const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

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
                      parts: [{ text: `Fact-check the following statement using google search by only responding with less than 100 characters: ${text}` }]
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

      // Check if response data structure is as expected
      if (factCheckData.candidates && factCheckData.candidates.length > 0 && factCheckData.candidates[0].content && factCheckData.candidates[0].content.parts && factCheckData.candidates[0].content.parts.length > 0 && factCheckData.candidates[0].content.parts[0].text) {
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
