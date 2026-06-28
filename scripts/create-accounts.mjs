// One-time admin seeding script. Creates Supabase Auth users + worker rows
// for the 18 real workers, all assigned to the EXISTING client "Elsa le
// Azalea" (slug 'elsa-le-azalea') — no new clients are created. Prints +
// saves a credentials sheet you hand out.
//
// Run with:
//   node --env-file=.env.local scripts/create-accounts.mjs
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase Dashboard →
// Settings → API → "service_role" secret). NEVER expose this key in the
// browser/app code — this script only runs locally on your machine.

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_CLIENT_SLUG = 'elsa-le-azalea';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '\nMissing env vars. Add SUPABASE_SERVICE_ROLE_KEY to .env.local (alongside your existing\n' +
      'NEXT_PUBLIC_SUPABASE_URL), then run again with:\n' +
      '  node --env-file=.env.local scripts/create-accounts.mjs\n'
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const WORKER_DOMAIN = 'workers.worksupply.local';

function randomPassword(length = 10) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const WORKERS = [
  { nif: '319623297', name: 'Koyes Ahmed' },
  { nif: '313570256', name: 'Jamshed Ali' },
  { nif: '309036020', name: 'Harpreet Singh' },
  { nif: '315575557', name: 'Tajinder Singh' },
  { nif: '315539127', name: 'Ranjeet Singh' },
  { nif: '320593118', name: 'Gurpreet Singh' },
  { nif: '314675960', name: 'Kulbir Singh' },
  { nif: '313656630', name: 'Daljit Singh' },
  { nif: '302634123', name: 'Karaj Singh' },
  { nif: '302188843', name: 'Gurdeep Singh' },
  { nif: '332703851', name: 'Ashok Kumar' },
  { nif: '323784623', name: 'Parveen Parveen' },
  { nif: '312492219', name: 'Mohit Singh' },
  { nif: '299238806', name: 'Narinder Singh' },
  { nif: '315881860', name: 'Gurpreet Singh' },
  { nif: '314180443', name: 'Prabhjot Singh Sidhu' },
  { nif: '314134468', name: 'Manoj Kumar' },
  { nif: '304347809', name: 'Gurmit Singh' },
];

const credentials = [];
const errors = [];

console.log(`Looking up existing client "${TARGET_CLIENT_SLUG}"...`);
const { data: client, error: clientErr } = await admin
  .from('clients')
  .select('id, name')
  .eq('slug', TARGET_CLIENT_SLUG)
  .single();

if (clientErr || !client) {
  console.error(`\nCould not find a client with slug "${TARGET_CLIENT_SLUG}". Nothing was created.`);
  console.error(clientErr?.message ?? 'No matching row.');
  process.exit(1);
}
console.log(`Found: ${client.name} (${client.id})\n`);

console.log('Creating workers...\n');
for (const w of WORKERS) {
  const email = `${w.nif}@${WORKER_DOMAIN}`;
  const password = randomPassword();
  try {
    const { data: userData, error: userErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (userErr) throw userErr;

    const { error: rowErr } = await admin
      .from('workers')
      .insert({ name: w.name, worker_code: w.nif, client_id: client.id, user_id: userData.user.id });
    if (rowErr) throw rowErr;

    credentials.push({ name: w.name, login: w.nif, password });
    console.log(`  ✓ ${w.name} (${w.nif})`);
  } catch (err) {
    errors.push(`${w.name} (${w.nif}): ${err.message}`);
    console.error(`  ✗ ${w.name} (${w.nif}) — ${err.message}`);
  }
}

// ── Print + save the credentials sheet ───────────────────────────────
const lines = [
  'WorkSupply Hours — worker login credentials',
  `Client: ${client.name}`,
  `Generated ${new Date().toISOString()}`,
  '',
  'ID is each worker\'s NIF',
  '='.repeat(60),
];
for (const c of credentials) {
  lines.push(`${c.name.padEnd(28)} ID: ${c.login.padEnd(12)} password: ${c.password}`);
}
if (errors.length) {
  lines.push('', 'ERRORS', '='.repeat(60), ...errors);
}

const out = lines.join('\n');
console.log('\n' + out + '\n');

const filename = `credentials-${Date.now()}.txt`;
writeFileSync(filename, out, 'utf8');
console.log(`Saved to ./${filename} — this file is gitignored. Keep it safe, then delete it once you've distributed the logins.`);
