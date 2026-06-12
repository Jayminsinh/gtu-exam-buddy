import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const uploadPDF = async (localFilePath) => {
  try {
    const fileBuffer = fs.readFileSync(localFilePath);
    const fileName = `${Date.now()}-${path.basename(localFilePath)}`;
    
    // Upload raw stream straight to our public papers bucket
    const { data, error } = await supabase.storage
      .from('papers')
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      });

    if (error) throw error;

    // Fetch the permanent public url string
    const { data: publicUrlData } = supabase.storage
      .from('papers')
      .getPublicUrl(fileName);

    // Wipe local server temp file securely
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);

    return {
      secure_url: publicUrlData.publicUrl,
      public_id: fileName
    };
  } catch (error) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    throw new Error(`Supabase storage processing failure: ${error.message}`);
  }
};
