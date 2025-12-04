export default async function handler(req, res) {
  // 仅允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 从服务端环境变量获取 API Key (安全，不会暴露给前端)
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Configuration Error: API_KEY is missing in server environment variables.' 
    });
  }

  try {
    // 解析请求体
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { prompt } = body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 直接调用 Google Gemini REST API
    // 使用 fetch 避免在 Serverless 环境中处理复杂的 SDK 依赖
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      throw new Error(data.error?.message || apiResponse.statusText);
    }

    // 提取文本内容
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated";

    return res.status(200).json({ text });

  } catch (error) {
    console.error('Gemini API Proxy Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}