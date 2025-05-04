import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase/server-component"

export async function GET() {
  try {
    const supabase = await createServerComponentClient()
    
    // Check if pitch_deck_url column exists
    let { error: checkError } = await supabase
      .from('startups')
      .select('pitch_deck_url')
      .limit(1)
    
    if (checkError && checkError.message.includes('does not exist')) {
      console.log('Pitch deck URL column does not exist')
      
      // Generate SQL that needs to be run manually
      const sqlToRun = `
ALTER TABLE public.startups
ADD COLUMN IF NOT EXISTS pitch_deck_url TEXT;

-- Get first document and set as pitch deck if available
UPDATE public.startups
SET pitch_deck_url = (
  SELECT media_documents[1]
  FROM public.startups s
  WHERE s.id = startups.id AND array_length(s.media_documents, 1) > 0
)
WHERE pitch_deck_url IS NULL;

-- Add comment to document the purpose of this column
COMMENT ON COLUMN public.startups.pitch_deck_url IS 'URL to the startup pitch deck document from media_documents array';

-- Create the appropriate index
CREATE INDEX IF NOT EXISTS idx_startups_pitch_deck_url ON public.startups (pitch_deck_url)
WHERE pitch_deck_url IS NOT NULL;`
      
      return NextResponse.json({ 
        success: false, 
        message: "Database schema needs to be fixed manually. Please run the following SQL in the Supabase dashboard SQL editor.",
        sqlToRun
      })
    } else if (checkError) {
      // Some other error occurred
      console.error('Error checking pitch_deck_url column:', checkError)
      return NextResponse.json({ 
        success: false, 
        message: 'Error checking database schema',
        error: checkError.message
      }, { status: 500 })
    }
    
    // Column already exists
    return NextResponse.json({ 
      success: true, 
      message: 'Database schema is already correct - pitch_deck_url column exists' 
    })
  } catch (error: any) {
    console.error('Error in fix-database route:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    }, { status: 500 })
  }
} 