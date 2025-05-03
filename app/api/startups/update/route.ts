import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create a Supabase client with admin powers
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false
    }
  }
);

// Generate a UUID for database records
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();
    console.log("API received update request:", data);
    
    const { 
      startupId, 
      startupData, 
      lookingForOptions, 
      socialLinks 
    } = data;
    
    if (!startupId || !startupData) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required data" 
      }, { status: 400 });
    }
    
    // Validate startupId exists and belongs to the user
    const { data: startupCheck, error: startupCheckError } = await supabaseAdmin
      .from("startups")
      .select("id")
      .eq("id", startupId)
      .single();
      
    if (startupCheckError || !startupCheck) {
      console.error("Startup validation error:", startupCheckError);
      return NextResponse.json({ 
        success: false, 
        error: "Invalid startup ID or not authorized to update this startup" 
      }, { status: 403 });
    }
    
    // Results object to track operation status
    const results: {
      startup: { 
        success: boolean; 
        error: any; 
        data: any; 
      };
      lookingFor: { 
        success: boolean; 
        error: any; 
        data: any; 
      };
      socialLinks: { 
        success: boolean; 
        error: any; 
        data: any; 
      };
    } = {
      startup: { success: false, error: null, data: null },
      lookingFor: { success: false, error: null, data: null },
      socialLinks: { success: false, error: null, data: null },
    };
    
    // 1. Update startup data
    try {
      // Log the update object for debugging
      console.log("Updating startup with data:", startupData);
      
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from("startups")
        .update(startupData)
        .eq("id", startupId)
        .select();
      
      if (updateError) {
        results.startup.error = updateError;
        console.error("Error updating startup:", updateError);
      } else {
        results.startup.success = true;
        results.startup.data = updateData;
        console.log("Startup updated successfully:", updateData);
      }
    } catch (err) {
      results.startup.error = err;
      console.error("Exception updating startup:", err);
    }
    
    // 2. Handle looking_for options
    if (lookingForOptions) {
      try {
        // 2.1 Delete existing options
        const { error: deleteError } = await supabaseAdmin
          .from("startup_looking_for")
          .delete()
          .eq("startup_id", startupId);
        
        if (deleteError) {
          results.lookingFor.error = deleteError;
          console.error("Error deleting looking_for options:", deleteError);
        } else {
          // 2.2 Insert new options
          if (lookingForOptions.length > 0) {
            const lookingForData = lookingForOptions.map((optionId: number) => ({
              startup_id: startupId,
              option_id: optionId,
            }));
            
            const { data: insertData, error: insertError } = await supabaseAdmin
              .from("startup_looking_for")
              .insert(lookingForData)
              .select();
            
            if (insertError) {
              results.lookingFor.error = insertError;
              console.error("Error inserting looking_for options:", insertError);
            } else {
              results.lookingFor.success = true;
              results.lookingFor.data = insertData;
              console.log("Looking for options inserted successfully:", insertData);
            }
          } else {
            results.lookingFor.success = true;
            console.log("No looking_for options to insert");
          }
        }
      } catch (err) {
        results.lookingFor.error = err;
        console.error("Exception handling looking_for options:", err);
      }
    }
    
    // 3. Handle social links
    if (socialLinks) {
      try {
        // 3.1 Log current state for debugging
        console.log("Processing social links:", socialLinks);
        
        // 3.2 Delete existing social links
        const { error: deleteError } = await supabaseAdmin
          .from("social_links")
          .delete()
          .eq("startup_id", startupId);
        
        if (deleteError) {
          results.socialLinks.error = deleteError;
          console.error("Error deleting social links:", deleteError);
        } else {
          console.log("Successfully deleted existing social links");
          
          // 3.3 Insert new social links
          const linksToAdd = [];
          
          if (socialLinks.linkedin && socialLinks.linkedin.trim() !== "") {
            const linkedinUrl = socialLinks.linkedin.trim();
            console.log("Adding LinkedIn link:", linkedinUrl);
            
            linksToAdd.push({
              id: generateUUID(),
              startup_id: startupId,
              platform: "linkedin",
              url: linkedinUrl,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          
          if (socialLinks.twitter && socialLinks.twitter.trim() !== "") {
            const twitterUrl = socialLinks.twitter.trim();
            console.log("Adding Twitter link:", twitterUrl);
            
            linksToAdd.push({
              id: generateUUID(),
              startup_id: startupId,
              platform: "twitter",
              url: twitterUrl,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          
          // Log links to add for debugging
          console.log(`Preparing to insert ${linksToAdd.length} social links:`, linksToAdd);
          
          if (linksToAdd.length > 0) {
            // Insert links using admin client to bypass RLS
            const insertResults = [];
            let anySuccess = false;
            
            for (const link of linksToAdd) {
              try {
                console.log(`Inserting ${link.platform} link with URL: ${link.url}`);
                
                const { data: insertData, error: insertError } = await supabaseAdmin
                  .from("social_links")
                  .insert(link)
                  .select();
                
                const result = {
                  platform: link.platform,
                  success: !insertError,
                  error: insertError,
                  data: insertData
                };
                
                insertResults.push(result);
                
                if (insertError) {
                  console.error(`Error inserting ${link.platform} link:`, insertError);
                  
                  // Attempt alternative insert method if the first fails
                  try {
                    console.log(`Trying alternative method for ${link.platform}...`);
                    const { data: altData, error: altError } = await supabaseAdmin.rpc(
                      'insert_social_link',
                      { 
                        p_startup_id: startupId,
                        p_platform: link.platform,
                        p_url: link.url
                      }
                    );
                    
                    if (!altError) {
                      console.log(`Successfully inserted ${link.platform} link using alternative method`);
                      result.success = true;
                      result.error = null;
                      anySuccess = true;
                    } else {
                      console.error(`Alternative method also failed for ${link.platform}:`, altError);
                    }
                  } catch (altErr) {
                    console.error(`Exception in alternative method for ${link.platform}:`, altErr);
                  }
                } else {
                  console.log(`Successfully inserted ${link.platform} link:`, insertData);
                  anySuccess = true;
                }
              } catch (err) {
                console.error(`Exception inserting ${link.platform} link:`, err);
                insertResults.push({
                  platform: link.platform,
                  success: false,
                  error: err
                });
              }
            }
            
            results.socialLinks.success = anySuccess;
            results.socialLinks.data = insertResults;
            
            if (anySuccess) {
              console.log("At least one social link was inserted successfully");
            } else {
              console.error("All social link insertions failed");
            }
          } else {
            results.socialLinks.success = true;
            console.log("No social links to insert");
          }
        }
      } catch (err) {
        results.socialLinks.error = err;
        console.error("Exception handling social links:", err);
      }
    }
    
    // Verify the final state after all operations
    try {
      const { data: verifyData, error: verifyError } = await supabaseAdmin
        .from("startups")
        .select(`
          *,
          social_links(id, platform, url),
          startup_looking_for(option_id)
        `)
        .eq("id", startupId)
        .single();
      
      if (verifyError) {
        console.error("Error verifying final state:", verifyError);
      } else {
        console.log("Final state verification:", {
          startup: verifyData,
          socialLinks: verifyData.social_links,
          lookingFor: verifyData.startup_looking_for
        });
      }
    } catch (err) {
      console.error("Exception verifying final state:", err);
    }
    
    // Return results
    const allSuccess = results.startup.success && 
                      (lookingForOptions ? results.lookingFor.success : true) && 
                      (socialLinks ? results.socialLinks.success : true);
    
    return NextResponse.json({
      success: allSuccess,
      results,
      message: allSuccess ? "Startup updated successfully" : "Some operations failed"
    });
    
  } catch (error) {
    console.error("Server error in update API:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Server error processing update" 
    }, { status: 500 });
  }
} 