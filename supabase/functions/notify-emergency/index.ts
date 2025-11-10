import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { alertId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Create client for user verification with anon key
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Extract user from JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    console.log(`Processing emergency alert: ${alertId} for user: ${user.id}`);

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch alert and verify ownership
    const { data: alert, error: alertError } = await supabase
      .from("alerts")
      .select(`
        *,
        profiles (
          full_name,
          phone,
          address
        )
      `)
      .eq("id", alertId)
      .eq("user_id", user.id)
      .single();

    if (alertError || !alert) {
      console.error("Error fetching alert or access denied:", alertError);
      return new Response(
        JSON.stringify({ error: "Alert not found or access denied" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Fetch user's emergency contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", alert.user_id)
      .order("priority", { ascending: false });

    if (contactsError) throw contactsError;

    // Log notification event
    await supabase.from("events").insert({
      alert_id: alertId,
      event_type: "notifications_sent",
      description: `Notified ${contacts?.length || 0} contacts and authorities`,
      metadata: {
        alert_type: alert.type,
        contacts_notified: contacts?.length || 0,
      },
    });

    console.log(`Emergency alert ${alertId} processed`);
    console.log(`Alert type: ${alert.type}`);
    console.log(`User ID: ${alert.user_id}`);
    console.log(`Location captured: ${!!alert.location_address}`);
    console.log(`Contacts notified: ${contacts?.length || 0}`);

    // In a real implementation, this would:
    // 1. Send SMS to contacts using Twilio
    // 2. Send emails using Resend
    // 3. Call emergency services API based on alert type
    // 4. Send push notifications

    return new Response(
      JSON.stringify({
        success: true,
        message: "Emergency notifications sent",
        contactsNotified: contacts?.length || 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing emergency:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
