export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body;
      
      const SUPABASE_URL = 'https://knufkvvxbwptoxxlnwpg.supabase.co';
      const SUPABASE_KEY = 'sb_publishable_5H-yd3hlXulNY79T285DQw_dcHrnrAJ';

      // Detect event type from various gateway formats (Kiwify, PerfectPay, Hotmart, etc.)
      const eventType = payload.event || payload.event_type || payload.type || payload.status || 'Webhook Recebido';
      
      // Detect amount
      let amount = 0;
      if (payload.data && payload.data.Commissions && payload.data.Commissions.charge_amount) {
        amount = payload.data.Commissions.charge_amount;
      } else if (payload.amount) {
        amount = payload.amount;
      } else if (payload.approved_amount) {
        amount = payload.approved_amount;
      } else if (payload.price) {
        amount = payload.price;
      }

      // Send to Supabase via REST API
      const url = `${SUPABASE_URL}/rest/v1/chaves_webhooks`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          source: 'checkout_webhook',
          event_type: eventType,
          amount: amount,
          payload: payload
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Supabase Error:', errText);
        return res.status(500).json({ error: 'Erro ao salvar no banco', details: errText });
      }

      return res.status(200).json({ success: true, message: 'Webhook salvo com sucesso!' });
    } catch (err) {
      console.error('API Error:', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
