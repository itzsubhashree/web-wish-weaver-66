import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  type: string;
  status: string;
  message: string;
  latitude: number;
  longitude: number;
  location_address: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  user_id: string;
  profiles: {
    full_name: string;
    phone: string;
  } | null;
}

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllAlerts();

      const channel = supabase
        .channel("admin-alerts")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "alerts",
          },
          () => {
            fetchAllAlerts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAdmin]);

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      navigate("/");
      toast({ title: "Access denied", description: "Admin access required", variant: "destructive" });
    } else {
      setIsAdmin(true);
    }
  };

  const fetchAllAlerts = async () => {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles separately
      const alertsWithProfiles = await Promise.all(
        data.map(async (alert) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", alert.user_id)
            .maybeSingle();
          
          return { ...alert, profiles: profile };
        })
      );
      setAlerts(alertsWithProfiles as Alert[]);
    }
  };

  const updateAlertStatus = async (alertId: string, newStatus: string) => {
    const updateData: any = { status: newStatus };
    
    if (newStatus === "acknowledged" && !alerts.find(a => a.id === alertId)?.acknowledged_at) {
      updateData.acknowledged_at = new Date().toISOString();
    } else if (newStatus === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("alerts")
      .update(updateData)
      .eq("id", alertId);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    } else {
      // Log event
      await supabase.from("events").insert({
        alert_id: alertId,
        event_type: "status_changed",
        description: `Status changed to ${newStatus}`,
        metadata: { new_status: newStatus },
      });

      toast({ title: "Status updated successfully" });
      fetchAllAlerts();
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{alert.type.toUpperCase()}</Badge>
                    <span className="text-base">
                      {alert.profiles?.full_name || "Unknown User"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {alert.message && (
                  <p className="text-sm">{alert.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  📍 {alert.location_address}
                </p>
                {alert.profiles?.phone && (
                  <p className="text-sm">📞 {alert.profiles.phone}</p>
                )}
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Status:</Label>
                  <Select
                    value={alert.status}
                    onValueChange={(value) => updateAlertStatus(alert.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="acknowledged">Acknowledged</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {alerts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No alerts in the system.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
