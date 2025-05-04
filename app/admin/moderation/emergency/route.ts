import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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

    // First get any user to assign as startup creator
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (userError || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'No users found in database' },
        { status: 500 }
      );
    }

    const userId = users[0].id;
    
    // Generate unique identifiers
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const random = Math.floor(Math.random() * 10000);
    const name = `EMERGENCY TEST STARTUP ${random}`;
    const slug = `emergency-test-startup-${random}`;

    // Insert a new startup with explicit pending status
    const { data: newStartup, error: insertError } = await supabase
      .from('startups')
      .insert({
        id: id,
        name: name,
        slug: slug,
        description: 'EMERGENCY TEST - This startup was created through the emergency endpoint to fix moderation issues.',
        status: 'pending', // EXPLICITLY PENDING
        user_id: userId,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    // Do a sanity check to verify it was created correctly
    const { data: verifyData, error: verifyError } = await supabase
      .from('startups')
      .select('id, name, status')
      .eq('id', id)
      .single();

    if (verifyError) {
      throw new Error(`Startup created but verification failed: ${verifyError.message}`);
    }

    // Let's also update any existing test startups to be sure
    const { data: existingTests, error: existingError } = await supabase
      .from('startups')
      .select('id')
      .like('name', '%Test Startup%')
      .neq('id', id); // Exclude the one we just created

    if (!existingError && existingTests && existingTests.length > 0) {
      const existingIds = existingTests.map(s => s.id);
      
      // Force update them
      await supabase
        .from('startups')
        .update({ 
          status: 'pending',
          updated_at: timestamp
        })
        .in('id', existingIds);
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Emergency startup created with pending status',
      startup: {
        id: verifyData.id,
        name: verifyData.name,
        status: verifyData.status
      }
    });

  } catch (error) {
    console.error('Emergency startup creation failed:', error);
    return NextResponse.json(
      { error: 'Emergency startup creation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
} 