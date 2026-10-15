/** Server-only forwarding: never expose the backend credential to browsers. */
export async function handleBookingRequest(req, res, config = process.env) {
  const respond = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  if (req.method !== 'POST') return respond(405, { message: 'Method Not Allowed' });
  if (req.headers['sec-fetch-site'] === 'cross-site') return respond(403, { message: 'მოთხოვნა უარყოფილია.' });
  if (!String(req.headers['content-type']).startsWith('application/json')) return respond(415, { message: 'საჭიროა JSON მოთხოვნა.' });
  if (!config.BOOKING_API_URL || !config.BOOKING_API_TOKEN) return respond(503, { message: 'ონლაინ გაგზავნა ჯერ არ არის ჩართული. თქვენი მენიუ შენარჩუნებულია. მოთხოვნა არ გაგზავნილა.' });
  try {
    const target = new URL(config.BOOKING_API_URL);
    if (target.protocol !== 'https:' && !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)) throw new Error('HTTPS required');
    const chunks = []; let bytes = 0;
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 24000) return respond(413, { message: 'მოთხოვნა ზედმეტად დიდია.' });
      chunks.push(chunk);
    }
    let payload;
    try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return respond(400, { message: 'მონაცემების ფორმატი არასწორია.' }); }
    const upstream = await fetch(target, { method: 'POST', redirect: 'error', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.BOOKING_API_TOKEN }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
    const data = await upstream.json();
    if (upstream.ok && typeof data.reference === 'string') return respond(upstream.status, { reference: data.reference, menuIncluded: Boolean(data.menuIncluded), status: 'pending' });
    if (upstream.status === 422) return respond(422, { message: 'გადაამოწმეთ თარიღი, სტუმრების რაოდენობა და საკონტაქტო მონაცემები.', errors: data.errors });
    if (upstream.status === 409) return respond(409, { message: 'მოთხოვნის მონაცემები შეიცვალა. განაახლეთ გვერდი და სცადეთ ხელახლა.' });
    if (upstream.status === 429) return respond(429, { message: 'ძალიან ბევრი მცდელობაა. გთხოვთ, ცოტა ხანში სცადოთ.' });
    return respond(503, { message: 'გაგზავნის სერვისი დროებით მიუწვდომელია. მონაცემები შენარჩუნებულია.' });
  } catch {
    return respond(503, { message: 'მიღების დადასტურება ვერ მოხერხდა. სცადეთ ხელახლა — მოთხოვნა არ გაორმაგდება.' });
  }
}
