// Contains base fetch/axios config
export const BASE_URL = 'http://localhost:5000/api';

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kfbhwmvaokazndizglkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYmh3bXZhb2them5kaXpnbGtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MTE2NywiZXhwIjoyMDkxMTU3MTY3fQ.QHgit2FrAs11Pb2yVJOgC0hflu1EvEE_AyjZTCDlbG4'
)

export const uploadFile = async (bucket, file, folder = '') => {
  const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  
  try {
    const response = await fetch(
      `https://kfbhwmvaokazndizglkj.supabase.co/storage/v1/object/${bucket}/${fileName}`,
      {
        method: 'POST',
        headers: {
          'x-upsert': 'true',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYmh3bXZhb2them5kaXpnbGtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MTE2NywiZXhwIjoyMDkxMTU3MTY3fQ.QHgit2FrAs11Pb2yVJOgC0hflu1EvEE_AyjZTCDlbG4',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYmh3bXZhb2them5kaXpnbGtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MTE2NywiZXhwIjoyMDkxMTU3MTY3fQ.QHgit2FrAs11Pb2yVJOgC0hflu1EvEE_AyjZTCDlbG4'
        },
        body: file
      }
    );

    if (response.ok) {
      console.log(`Successfully uploaded to: ${bucket}`);
      return `https://kfbhwmvaokazndizglkj.supabase.co/storage/v1/object/public/${bucket}/${fileName}`;
    } else {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.message || response.statusText}`);
    }
  } catch (e) {
    throw new Error(`Storage upload error: ${e.message}`);
  }
}






