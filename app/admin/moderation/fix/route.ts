import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all test startups
    const { data: testStartups, error: findError } = await supabase
      .from('startups')
      .select('id, name, status')
      .like('name', '%Test Startup%');

    if (findError) {
      throw findError;
    }

    // No test startups found
    if (!testStartups || testStartups.length === 0) {
      return NextResponse.json({ 
        message: 'No test startups found to fix' 
      });
    }

    // Force update all test startups to "pending" status
    const startupIds = testStartups.map(s => s.id);
    
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

    // Return success with list of updated startups
    return NextResponse.json({
      message: `Successfully fixed ${testStartups.length} test startups`,
      updated: testStartups.map(s => ({
        id: s.id,
        name: s.name,
        oldStatus: s.status,
        newStatus: 'pending'
      }))
    });

  } catch (error) {
    console.error('Error fixing test startups:', error);
    return NextResponse.json(
      { error: 'An error occurred while fixing test startups' },
      { status: 500 }
    );
  }
} 