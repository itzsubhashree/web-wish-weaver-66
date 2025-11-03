import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  status: string;
  message: string;
  latitude: number;
  longitude: number;
  location_address: string;
  created_at: string;
}

export default function Alerts() {
  const [user, setUser] = useState<User | null>(null);
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
      fetchAlerts();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel("alerts")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "alerts",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchAlerts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setAlerts(data || []);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "acknowledged":
        return "bg-blue-500";
      case "resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "medical":
        return "bg-red-500";
      case "fire":
        return "bg-orange-500";
      case "police":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Alert History</h1>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getTypeColor(alert.type)}>
                      {alert.type.toUpperCase()}
                    </Badge>
                    <Badge className={getStatusColor(alert.status)}>
                      {alert.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alert.message && (
                  <p className="text-sm mb-2">{alert.message}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  📍 {alert.location_address}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {alerts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No alerts triggered yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
