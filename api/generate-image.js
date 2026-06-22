// Vercel Serverless — /api/generate-image
  // Server fetches image from Pollinations (no CORS issue for client)
  module.exports = async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers","Content-Type");

    if (req.method === "OPTIONS") { res.writeHead(200); res.end("{}"); return; }
    if (req.method !== "POST") { res.writeHead(405); res.end(JSON.stringify({error:"Method not allowed"})); return; }

    let body = "";
    await new Promise(r => { req.on("data", c => body += c); req.on("end", r); req.on("error", r); });
    let prompt = "";
    try { prompt = JSON.parse(body).prompt || ""; } catch { }
    if (!prompt.trim()) { res.writeHead(400); res.end(JSON.stringify({error:"prompt diperlukan"})); return; }

    const seed = Math.floor(Math.random() * 999999);
    const encoded = encodeURIComponent(prompt.slice(0, 500));

    // Try flux-pro first (better quality), fallback flux
    const urls = [
      `https://image.pollinations.ai/prompt/${encoded}?width=768&height=512&seed=${seed}&nologo=true&model=flux-pro`,
      `https://image.pollinations.ai/prompt/${encoded}?width=768&height=512&seed=${seed}&nologo=true&model=flux`,
    ];

    function timeout(ms) {
      return new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms));
    }

    for (const url of urls) {
      try {
        const imgRes = await Promise.race([fetch(url), timeout(28000)]);
        if (!imgRes.ok) continue;
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length < 1000) continue;
        const ct = imgRes.headers.get("content-type") || "image/jpeg";
        const b64 = buf.toString("base64");
        res.writeHead(200, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ dataUrl: `data:${ct};base64,${b64}`, url }));
        return;
      } catch { continue; }
    }

    res.writeHead(503);
    res.end(JSON.stringify({error:"Gagal generate gambar, coba lagi ya!"}));
  };
  