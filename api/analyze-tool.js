export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    // Anrop till OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identifiera verktyget på bilden. Svara ENDAST med ett giltigt JSON-objekt med följande nycklar: "title" (namn på verktyget på svenska), "category" (välj en av: Trädgård, Bygg & El, Handverktyg, Städ & Rengöring, Övrigt) och "description" (kort beskrivning).',
              },
              {
                type: 'image_url',
                image_url: { url: image },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return res.status(200).json(content);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Kunde inte analysera bilden' });
  }
}