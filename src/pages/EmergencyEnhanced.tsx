/**
 * ENHANCED EMERGENCY PAGE - Demonstrates OOP Integration
 * Uses all OOP service classes: Alert, LocationService, NotificationService, FileHandler
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, AlertTriangle, Volume2, VolumeX } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LocationService } from "@/services/LocationService";
import { AuthorityAlert } from "@/services/AlertTypes";
import { NotificationService } from "@/services/NotificationService";
import { FileHandler } from "@/services/FileHandler";
import { AlertType } from "@/services/Alert";
import { z } from "zod";

const alertSchema = z.object({
  type: z.enum(['medical', 'fire', 'police', 'general']),
  message: z.string().trim().max(1000, "Message must be less than 1000 characters").optional(),
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
  location_address: z.string().max(500, "Location address must be less than 500 characters")
});

export default function EmergencyEnhanced() {
  const [user, setUser] = useState<User | null>(null);
  const [alertType, setAlertType] = useState<AlertType>("general");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  
  // OOP: Using LocationService singleton instance
  const locationService = LocationService.getInstance();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    // Initialize audio for panic alarm
    // audioRef.current = new Audio('/panic-sound.mp3');
    
    return () => {
      locationService.stopWatchingLocation();
    };
  }, [navigate]);

  // OOP: Using LocationService to capture location
  const captureLocation = async () => {
    setLoading(true);
    try {
      const locationData = await locationService.captureLocation();
      setLocation({ lat: locationData.lat, lng: locationData.lng });
      setLocationAddress(locationData.address);
      toast({ 
        title: "Location captured", 
        description: "Your location has been recorded successfully." 
      });
    } catch (error: any) {
      toast({
        title: "Location error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Play panic sound
  const playPanicSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(console.error);
    }
  };

  const stopPanicSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // Countdown before emergency trigger
  const startCountdown = () => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please capture your location before triggering an alert.",
        variant: "destructive",
      });
      return;
    }

    setIsEmergencyActive(true);
    setCountdown(5);
    playPanicSound();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          triggerEmergency();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    setCountdown(null);
    setIsEmergencyActive(false);
    stopPanicSound();
    toast({
      title: "Alert cancelled",
      description: "Emergency alert has been cancelled.",
    });
  };

  // OOP: Using Alert classes and NotificationService
  const triggerEmergency = async () => {
    if (!user || !location) return;

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
    stopPanicSound();

    try {
      // OOP: Create AuthorityAlert instance
      const alert = new AuthorityAlert(
        user.id,
        alertType,
        message || `Emergency ${alertType} alert triggered`,
        location,
        locationAddress
      );

      // Fetch contacts using NotificationService
      const contacts = await NotificationService.getEmergencyContacts(user.id);

      // OOP: POLYMORPHISM - Send alerts using different notification types
      const result = await NotificationService.notifyAll(alert, contacts);

      // OOP: FILE HANDLING - Save log to local storage
      FileHandler.saveLog({
        id: alert.id,
        userId: user.id,
        type: alertType,
        message: alert.message,
        location,
        locationAddress,
        timestamp: alert.timestamp,
        status: alert.status,
        notificationResults: result.results,
      });

      // Log event to database
      await supabase.from("events").insert({
        alert_id: alert.id,
        event_type: "alert_created",
        description: `Emergency alert triggered: ${alertType}`,
        metadata: { 
          location, 
          message: alert.message,
          contactsNotified: contacts.length 
        },
      });

      toast({
        title: "🚨 Emergency alert sent!",
        description: `${contacts.length} contacts and authorities notified.`,
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
      setIsEmergencyActive(false);
      setCountdown(null);
    }
  };

  return (
    <div className="min-h-screen gradient-hero relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-destructive/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto p-6 relative z-10">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="hover:bg-primary/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-destructive bg-clip-text text-transparent">
            🚨 Emergency Alert System
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Left Column: Emergency Form */}
          <Card className="shadow-emergency border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6 pulse-ring" />
                Trigger Emergency Alert
              </CardTitle>
              <CardDescription>
                This will notify your emergency contacts and local authorities immediately
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="alertType">Alert Type</Label>
                <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                  <SelectTrigger className="border-primary/30 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medical">🏥 Medical Emergency</SelectItem>
                    <SelectItem value="fire">🔥 Fire</SelectItem>
                    <SelectItem value="police">👮 Police</SelectItem>
                    <SelectItem value="general">⚠️ General Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Describe the emergency situation..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="border-primary/30 focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Button
                  variant="outline"
                  onClick={captureLocation}
                  disabled={loading || isEmergencyActive}
                  className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  {location ? "📍 Update Location" : "📍 Capture Location"}
                </Button>
                {location && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded-md">
                    <p className="text-sm font-medium text-success">Location Captured:</p>
                    <p className="text-xs text-muted-foreground mt-1">{locationAddress}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="h-8 w-8"
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Panic sound {soundEnabled ? "enabled" : "disabled"}
                </span>
              </div>

              {countdown !== null ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-destructive animate-shake">
                      {countdown}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Alert triggering in {countdown} second{countdown !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    onClick={cancelCountdown}
                    variant="outline"
                    className="w-full border-success hover:bg-success/10"
                    size="lg"
                  >
                    CANCEL ALERT
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={startCountdown}
                  disabled={loading || !location}
                  className="w-full gradient-emergency shadow-emergency hover:opacity-90 transition-all"
                  size="lg"
                >
                  {loading ? "SENDING..." : "🚨 TRIGGER EMERGENCY ALERT"}
                </Button>
              )}

              <p className="text-xs text-center text-muted-foreground">
                ⚠️ Only use in real emergencies. False alarms may result in penalties.
              </p>
            </CardContent>
          </Card>

          {/* Right Column: Google Maps & Instructions */}
          <div className="space-y-6">
            {/* Google Maps */}
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-secondary" />
                  Live Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                {location ? (
                  <div className="relative h-64 w-full rounded-lg overflow-hidden border border-border">
                    <iframe
                      title="Emergency Location"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01},${location.lat - 0.01},${location.lng + 0.01},${location.lat + 0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
                      style={{ border: 0 }}
                    />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg border border-dashed border-border">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Capture your location to view map
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-warning/20 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-warning">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <p>Select your emergency type and add optional details</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <p>Capture your current location for responders</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <p>Press the emergency button - you'll have 5 seconds to cancel</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <p>SMS, Email, and Push notifications sent to all contacts</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <p>Local authorities automatically notified based on alert type</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* OOP Concepts Info Card */}
        <Card className="max-w-6xl mx-auto mt-6 border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-accent">🎓 OOP Concepts Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Classes & Objects</h4>
                <p className="text-muted-foreground">Alert, LocationService, NotificationService instances</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Encapsulation</h4>
                <p className="text-muted-foreground">Private properties with getters/setters in all service classes</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Abstraction</h4>
                <p className="text-muted-foreground">Abstract Alert.sendAlert() method hidden complexity</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Inheritance</h4>
                <p className="text-muted-foreground">SMSAlert, EmailAlert extend base Alert class</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Polymorphism</h4>
                <p className="text-muted-foreground">Each alert type implements sendAlert() differently</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">File Handling</h4>
                <p className="text-muted-foreground">FileHandler saves/reads emergency logs locally</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
