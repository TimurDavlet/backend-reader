import { createClient } from '@supabase/supabase-js';
import path from 'path';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'lexicon';

export async function uploadImage(buffer, originalFilename) {
  const ext      = path.extname(originalFilename).toLowerCase() || '.jpg';
  const filename = `images/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: getContentType(ext),
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { url: data.publicUrl };
}

export async function uploadAudio(buffer, originalFilename) {
  const ext      = path.extname(originalFilename).toLowerCase() || '.mp3';
  const filename = `audio/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: getContentType(ext),
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return { url: data.publicUrl };
}

export async function deleteFile(url) {
  // Извлекаем путь из публичного URL
  // URL вида: https://xxx.supabase.co/storage/v1/object/public/lexicon/images/file.jpg
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;

  const filePath = url.slice(idx + marker.length);
  await supabase.storage.from(BUCKET).remove([filePath]);
}

function getContentType(ext) {
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.webp': 'image/webp',
    '.gif': 'image/gif',  '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',  '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
  };
  return map[ext] || 'application/octet-stream';
}