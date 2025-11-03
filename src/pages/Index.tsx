import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication and redirect if needed
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          navigate("/auth");
        }
      });
    });
  }, [navigate]);

  return <Dashboard />;
}
