import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv();

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL || 'PayMatch <onboarding@resend.dev>';
const testRecipient = process.env.RESEND_TEST_RECIPIENT || 'eniolabadmus351@gmail.com';

if (!apiKey) {
  console.error('No RESEND_API_KEY found');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function main() {
  const customer = process.argv[2] || 'customer@example.com';
  console.log(`From: ${from}`);
  console.log(`Test recipient (owner): ${testRecipient}`);
  console.log(`Attempting to send to customer: ${customer}`);

  // Step 1: try customer
  const r1 = await resend.emails.send({
    from,
    to: customer,
    subject: 'Invoice INV-001 - Payment Request from PayMatch',
    html: '<p>Hello Customer, here is your invoice.</p>',
  });

  if (r1.error) {
    console.log('Customer send REJECTED by Resend:', r1.error.message);
    console.log('-> Re-routing to test recipient (owner) via resend.dev...');

    const r2 = await resend.emails.send({
      from,
      to: testRecipient,
      subject: `[TEST] Invoice INV-001 - Payment Request from PayMatch`,
      html: `<p><em>Test mode: intended for ${customer}</em></p><p>Hello Customer, here is your invoice.</p>`,
    });

    if (r2.error) {
      console.error('FALLBACK FAILED:', r2.error.message);
    } else {
      console.log('FALLBACK SUCCESS - delivered to owner. id:', r2.data?.id);
    }
  } else {
    console.log('Customer send succeeded directly. id:', r1.data?.id);
  }
}

main();