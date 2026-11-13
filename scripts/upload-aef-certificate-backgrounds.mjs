// Install the private signed certificate backgrounds in the Apps Script Drive folder.
// Uses the same local clasp login as the certificate project; no token is printed.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folderName = 'AEF Cohort 1 Certificates';
const names = [
  'aef-cohort-1-completion-background.png',
  'aef-cohort-1-participation-background.png',
];
const mode = process.argv[2] || '--list';
if (!['--list', '--upload'].includes(mode)) throw new Error('Use --list or --upload.');

const login = JSON.parse(await readFile(path.join(homedir(), '.clasprc.json'), 'utf8'));
const account = login.tokens?.[process.env.AEF_CLASP_USER || 'default'];
if (!account?.refresh_token) throw new Error('The selected clasp login has no refresh token.');

const tokenReply = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body: new URLSearchParams({
    client_id: account.client_id,
    client_secret: account.client_secret,
    refresh_token: account.refresh_token,
    grant_type: 'refresh_token',
  }),
});
if (!tokenReply.ok) throw new Error(`Could not refresh clasp login (HTTP ${tokenReply.status}).`);
const { access_token: accessToken } = await tokenReply.json();

async function drive(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`Google Drive request failed (HTTP ${response.status}).`);
  return response.json();
}

async function findFiles(query) {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('fields', 'files(id,name,mimeType,md5Checksum,capabilities(canEdit)),nextPageToken');
  url.searchParams.set('pageSize', '100');
  const reply = await drive(url);
  if (reply.nextPageToken) throw new Error('Too many matching Drive files; narrow the selection.');
  return reply.files || [];
}

const folders = await findFiles(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
if (folders.length !== 1) throw new Error(`Expected one certificate folder in this clasp account; found ${folders.length}.`);
const folder = folders[0];
console.log(`Certificate folder found: ${folder.id}`);

for (const name of names) {
  const bytes = await readFile(path.join(root, 'assets', 'signatures', name));
  const checksum = createHash('md5').update(bytes).digest('hex');
  const files = await findFiles(`'${folder.id}' in parents and name = '${name}' and trashed = false`);
  if (files.length > 1) throw new Error(`Multiple Drive files named ${name}; resolve this before uploading.`);
  if (mode === '--list') {
    console.log(`${name}: local ${bytes.length} bytes; Drive ${files.length ? files[0].id : 'missing'}; editable ${files.length ? files[0].capabilities?.canEdit : 'n/a'}`);
    continue;
  }
  if (files.length && files[0].md5Checksum === checksum) {
    console.log(`${name}: already matches the local design (${files[0].id})`);
    continue;
  }

  let uploaded;
  if (files.length) {
    uploaded = await drive(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(files[0].id)}?uploadType=media&fields=id,name,md5Checksum`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'image/png' },
      body: bytes,
    });
  } else {
    const boundary = `aef${Date.now()}`;
    const metadata = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [folder.id], mimeType: 'image/png' })}\r\n--${boundary}\r\nContent-Type: image/png\r\n\r\n`);
    const ending = Buffer.from(`\r\n--${boundary}--`);
    uploaded = await drive('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,md5Checksum', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: Buffer.concat([metadata, bytes, ending]),
    });
  }
  if (uploaded.md5Checksum !== checksum) throw new Error(`Drive checksum did not match for ${name}.`);
  console.log(`${name}: installed and verified (${uploaded.id})`);
}
