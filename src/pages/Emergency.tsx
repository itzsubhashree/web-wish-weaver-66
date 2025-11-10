import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const alertSchema = z.object({
  type: z.enum(['medical', 'fire', 'police', 'general']),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
  location_address: z.string().max(500, "Location address must be less than 500 characters")
});

export default function Emergency() {
  const [user, setUser] = useState<User | null>(null);
  const [alertType, setAlertType] = useState<"medical" | "fire" | "police" | "general">("general");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          setLocationAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
          toast({ title: "Location captured", description: "Your location has been recorded." });
          setLoading(false);
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Unable to capture location. Please enable location services.",
            variant: "destructive",
          });
          setLoading(false);
        }
      );
    } else {
      toast({
        title: "Not supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  const triggerEmergency = async () => {
    if (!user) return;
    if (!location) {
      toast({
        title: "Location required",
        description: "Please capture your location before triggering an alert.",
        variant: "destructive",
      });
      return;
    }

    // Validate input
    const result = alertSchema.safeParse({
      type: alertType,
      message: message || undefined,
      latitude: location.lat,
      longitude: location.lng,
      location_address: locationAddress
    });

    if (!result.success) {
      toast({
        title: "Validation error",
        description: result.error.issues[0].message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create alert
      const { data: alertData, error: alertError } = await supabase
        .from("alerts")
        .insert({
          user_id: user.id,
          type: alertType,
          message,
          latitude: location.lat,
          longitude: location.lng,
          location_address: locationAddress,
          status: "pending",
        })
        .select()
        .single();

      if (alertError) throw alertError;

      // Log event
      await supabase.from("events").insert({
        alert_id: alertData.id,
        event_type: "alert_created",
        description: `Emergency alert triggered: ${alertType}`,
        metadata: { location, message },
      });

      // Call notification function
      await supabase.functions.invoke("notify-emergency", {
        body: { alertId: alertData.id },
      });

      toast({
        title: "Emergency alert sent!",
        description: "Your contacts and authorities have been notified.",
      });

      setTimeout(() => navigate("/alerts"), 2000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-destructive/5">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-destructive">Emergency Alert</h1>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              Trigger Emergency Alert
            </CardTitle>
            <CardDescription>
              This will notify your emergency contacts and local authorities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="alertType">Alert Type</Label>
              <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="police">Police</SelectItem>
                  <SelectItem value="general">General Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Describe the emergency..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={captureLocation}
                  disabled={loading}
                  className="flex-1"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {location ? "Update Location" : "Capture Location"}
                </Button>
              </div>
              {location && (
                <p className="text-sm text-muted-foreground mt-2">
                  📍 {locationAddress}
                </p>
              )}
            </div>

            <Button
              onClick={triggerEmergency}
              disabled={loading || !location}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {loading ? "Sending Alert..." : "TRIGGER EMERGENCY ALERT"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Only use in real emergencies. False alarms may result in penalties.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
