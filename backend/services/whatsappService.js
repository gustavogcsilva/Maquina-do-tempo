/**
 * Serviço de envio de WhatsApp gratuito para o projeto Máquina do Tempo.
 * 
 * Provedores suportados (100% gratuitos para portfólio):
 * 1. Meta Cloud API (1.000 conversas gratuitas por mês com WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID)
 * 2. CallMeBot API (Gratuito sem cadastro de cartão com CALLMEBOT_API_KEY)
 * 3. Modo Sandbox Portfólio (Fallback que gera o link oficial wa.me e simula envio com sucesso)
 */

export async function sendWhatsappMessage({ to, message }) {
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const callMeBotApiKey = process.env.CALLMEBOT_API_KEY;

  const cleanPhone = (to || '').replace(/\D/g, '');

  // 1. WhatsApp Cloud API Oficial da Meta (1.000 conversas/mês gratuitas)
  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${metaPhoneId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: message },
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || 'Falha na Meta Cloud API.');
      }

      const data = await response.json();
      console.info(`[WhatsApp Meta API]: Mensagem enviada para ${cleanPhone}`);
      return { success: true, provider: 'meta_cloud_api', id: data.messages?.[0]?.id };
    } catch (err) {
      console.error('[Erro WhatsApp Meta]:', err.message);
      throw err;
    }
  }

  // 2. CallMeBot API Gratuita (Rápida para testes pessoais)
  if (callMeBotApiKey) {
    try {
      const encodedMsg = encodeURIComponent(message);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMsg}&apikey=${callMeBotApiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha no gateway CallMeBot.');
      }

      console.info(`[WhatsApp CallMeBot]: Mensagem enviada para ${cleanPhone}`);
      return { success: true, provider: 'callmebot' };
    } catch (err) {
      console.error('[Erro CallMeBot]:', err.message);
      throw err;
    }
  }

  // 3. Modo Demonstração & Portfólio (Zero custo, gera link direto oficial)
  const directLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  console.info('======================================================');
  console.info('📱 [WHATSAPP SIMULADO - MODO PORTFÓLIO GRATUITO]');
  console.info(`Destinatário: +${cleanPhone}`);
  console.info(`Link direto para envio: ${directLink}`);
  console.info(`Mensagem: ${message}`);
  console.info('======================================================');

  return {
    success: true,
    provider: 'simulated_portfolio',
    directLink,
    notice: 'Envio de WhatsApp processado e link de teste gerado com sucesso.',
  };
}

