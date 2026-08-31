// Contains base fetch/axios config
export const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://kfbhwmvaokazndizglkj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmYmh3bXZhb2them5kaXpnbGtqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU4MTE2NywiZXhwIjoyMDkxMTU3MTY3fQ.QHgit2FrAs11Pb2yVJOgC0hflu1EvEE_AyjZTCDlbG4'
)

export const uploadFile = async (bucket, file, folder = '') => {
  const fileName = `${folder}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  
  // Automatic fallback in case of name mismatch (singular vs plural)
  const bucketsToTry = [bucket, 'driver-documents', 'drivers', 'documents', 'vehicle-documents', 'vehicles'];
  
  for (const b of bucketsToTry) {
    try {
      const response = await fetch(
        `https://kfbhwmvaokazndizglkj.supabase.co/storage/v1/object/${b}/${fileName}`,
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
        console.log(`Successfully uploaded to: ${b}`);
        return `https://kfbhwmvaokazndizglkj.supabase.co/storage/v1/object/public/${b}/${fileName}`;
      }
    } catch (e) {
      continue;
    }
  }

  throw new Error("Storage bucket not found. Please verify the bucket ID in Supabase.");
}
