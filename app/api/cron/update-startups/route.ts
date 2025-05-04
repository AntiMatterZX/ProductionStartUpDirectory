import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify the request has a valid authorization token
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Initialize the Supabase client using service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Find startups with missing or incorrect status
    const { data: startups, error: searchError } = await supabase
      .from('startups')
      .select('id, name, status')
      .not('status', 'in', '("pending","approved","rejected")')
      .order('created_at', { ascending: false });
    
    if (searchError) {
      throw searchError;
    }
    
    if (!startups || startups.length === 0) {
      return NextResponse.json({ 
        success: true,
        message: 'No startups need updates' 
      });
    }
    
    // Update all found startups to pending status
    const startupIds = startups.map(s => s.id);
    const { error: updateError } = await supabase
      .from('startups')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString() 
      })
      .in('id', startupIds);
    
    if (updateError) {
      throw updateError;
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      updatedCount: startups.length,
      updatedStartups: startups.map(s => ({ 
        id: s.id, 
        name: s.name, 
        oldStatus: s.status 
      }))
    });
    
  } catch (error) {
    console.error('Error in startup status update cron:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
} 