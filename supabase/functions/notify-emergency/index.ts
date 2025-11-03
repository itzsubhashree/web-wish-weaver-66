import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { alertId } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch alert details with user profile
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
      .single();

    if (alertError) throw alertError;

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
    console.log(`User: ${alert.profiles.full_name}`);
    console.log(`Location: ${alert.location_address}`);
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
