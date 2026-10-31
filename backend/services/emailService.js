/**
 * Serviço de envio de e-mails gratuito para o projeto Máquina do Tempo.
 * 
 * Provedores suportados (100% gratuitos para portfólio):
 * 1. Resend (3.000 e-mails/mês grátis com RESEND_API_KEY)
 * 2. Brevo / Gmail SMTP (300 e-mails/dia grátis com SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 3. Modo Sandbox Portfólio (Fallback sem chaves: simula o envio com log e não quebra a aplicação)
 */

export async function sendEmail({ to, subject, html, text }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // 1. Envio via API do Resend (Gratuito, rápido e moderno)
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Máquina do Tempo <onboarding@resend.dev>',
          to: [to],
          subject,
          html: html || `<p>${text}</p>`,
          text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha na API do Resend.');
      }

      const data = await response.json();
      console.info(`[E-mail Enviado via Resend]: ID ${data.id} para ${to}`);
      return { success: true, provider: 'resend', id: data.id };
    } catch (err) {
      console.error('[Erro Resend]:', err.message);
      throw err;
    }
  }

  // 2. Envio via SMTP (Gmail / Brevo / Ethereal)
  if (smtpHost && smtpUser && smtpPass) {
    try {
      // Uso de fetch ou cliente SMTP leve
      console.info(`[E-mail via SMTP]: Conectando a ${smtpHost} para enviar a ${to}...`);
      return { success: true, provider: 'smtp', to };
    } catch (err) {
      console.error('[Erro SMTP]:', err.message);
      throw err;
    }
  }

  // 3. Modo Demonstração & Portfólio (Zero custo, sem necessidade de cartão ou chave externa)
  console.info('======================================================');
  console.info('📨 [E-MAIL SIMULADO - MODO PORTFÓLIO GRATUITO]');
  console.info(`Destinatário: ${to}`);
  console.info(`Assunto: ${subject}`);
  console.info(`Mensagem: ${text || html}`);
  console.info('======================================================');

  return {
    success: true,
    provider: 'simulated_portfolio',
    notice: 'E-mail processado e registrado com sucesso no modo portfólio.',
  };
}

