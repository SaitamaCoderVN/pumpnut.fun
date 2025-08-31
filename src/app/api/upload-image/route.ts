import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const { image } = await request.json();
    
    // Remove the data:image/png;base64, prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique filename
    const filename = `share-${Date.now()}.png`;
    const filepath = join(process.cwd(), 'public', 'shares', filename);
    
    // Ensure the directory exists
    await writeFile(filepath, buffer);
    
    // Return the public URL
    return NextResponse.json({
      url: `/shares/${filename}`
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
} 