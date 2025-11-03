/**
 * ABSTRACTION: NotificationService provides abstract interface for notifications
 * Hides complex notification logic behind simple methods
 */

import { Alert } from "./Alert";
import { SMSAlert, EmailAlert, AuthorityAlert, PushNotificationAlert } from "./AlertTypes";
import { supabase } from "@/integrations/supabase/client";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

export class NotificationService {
  // ABSTRACTION: Simplified interface for complex notification process
  static async notifyAll(
    alert: Alert,
    contacts: Contact[]
  ): Promise<{ success: boolean; results: any[] }> {
    const results = [];

    // Create different types of alerts using POLYMORPHISM
    const phoneNumbers = contacts.map((c) => c.phone).filter(Boolean);
    const emailAddresses = contacts.map((c) => c.email).filter(Boolean) as string[];

    // SMS Alerts
    if (phoneNumbers.length > 0) {
      const smsAlert = new SMSAlert(
        alert.userId,
        alert.type,
        alert.message,
        alert.location,
        alert.locationAddress,
        phoneNumbers
      );
      const result = await smsAlert.sendAlert();
      results.push({ type: "SMS", ...result });
    }

    // Email Alerts
    if (emailAddresses.length > 0) {
      const emailAlert = new EmailAlert(
        alert.userId,
        alert.type,
        alert.message,
        alert.location,
        alert.locationAddress,
        emailAddresses
      );
      const result = await emailAlert.sendAlert();
      results.push({ type: "Email", ...result });
    }

    // Authority Alert
    const authorityAlert = new AuthorityAlert(
      alert.userId,
      alert.type,
      alert.message,
      alert.location,
      alert.locationAddress
    );
    const authorityResult = await authorityAlert.sendAlert();
    results.push({ type: "Authority", ...authorityResult });

    // Push Notifications (simulated)
    const pushAlert = new PushNotificationAlert(
      alert.userId,
      alert.type,
      alert.message,
      alert.location,
      alert.locationAddress,
      ["device-token-1", "device-token-2"]
    );
    const pushResult = await pushAlert.sendAlert();
    results.push({ type: "Push", ...pushResult });

    const allSuccess = results.every((r) => r.success);

    return { success: allSuccess, results };
  }

  // ABSTRACTION: Simplified method to fetch contacts
  static async getEmergencyContacts(userId: string): Promise<Contact[]> {
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", userId)
      .order("priority", { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
