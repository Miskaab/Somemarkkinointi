import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const sql = neon(process.env.DATABASE_URL!);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error('Webhook: stripe-signature tai STRIPE_WEBHOOK_SECRET puuttuu.');
    return NextResponse.json({ error: 'Webhook-asetukset puuttuvat.' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook-allekirjoitusvirhe:', err?.message);
    return NextResponse.json(
      { error: `Webhook-allekirjoitusvirhe: ${err?.message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const email = session.customer_details?.email || session.customer_email || '';

      if (!userId) {
        console.warn('Webhook: checkout.session.completed tuli ilman metadata.userId-arvoa.');
      } else {
        await sql`
          INSERT INTO users (id, email, usage_count, is_pro)
          VALUES (${userId}, ${email}, 0, true)
          ON CONFLICT (id) DO UPDATE
          SET is_pro = true,
              email = COALESCE(NULLIF(EXCLUDED.email, ''), users.email)
        `;
        console.log(`Webhook: käyttäjä ${userId} päivitetty Pro-tilaan.`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await sql`
          UPDATE users
          SET is_pro = false
          WHERE id = ${userId}
        `;
        console.log(`Webhook: käyttäjän ${userId} Pro-tila poistettu.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook-tietokantavirhe:', error?.message);
    return NextResponse.json(
      { error: error?.message || 'Webhook-käsittely epäonnistui.' },
      { status: 500 }
    );
  }
}