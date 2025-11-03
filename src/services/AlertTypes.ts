/**
 * CHILD CLASSES demonstrating INHERITANCE and POLYMORPHISM
 * Each alert type inherits from Alert base class and implements sendAlert() differently
 */

import { Alert, AlertType } from "./Alert";
import { supabase } from "@/integrations/supabase/client";

// INHERITANCE: SMSAlert extends Alert
export class SMSAlert extends Alert {
  private phoneNumbers: string[];

  constructor(
    userId: string,
    type: AlertType,
    message: string,
    location: { lat: number; lng: number } | null,
    locationAddress: string,
    phoneNumbers: string[]
  ) {
    super(userId, type, message, location, locationAddress);
    this.phoneNumbers = phoneNumbers;
  }

  // POLYMORPHISM: Overriding sendAlert() for SMS-specific logic
  async sendAlert(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📱 Sending SMS alerts to ${this.phoneNumbers.length} contacts`);
      // Simulate SMS sending
      this.status = "acknowledged";
      return {
        success: true,
        message: `SMS alerts sent to ${this.phoneNumbers.length} contacts`,
      };
    } catch (error) {
      this.status = "pending";
      return { success: false, message: "Failed to send SMS alerts" };
    }
  }
}

// INHERITANCE: EmailAlert extends Alert
export class EmailAlert extends Alert {
  private emailAddresses: string[];

  constructor(
    userId: string,
    type: AlertType,
    message: string,
    location: { lat: number; lng: number } | null,
    locationAddress: string,
    emailAddresses: string[]
  ) {
    super(userId, type, message, location, locationAddress);
    this.emailAddresses = emailAddresses;
  }

  // POLYMORPHISM: Overriding sendAlert() for Email-specific logic
  async sendAlert(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📧 Sending email alerts to ${this.emailAddresses.length} contacts`);
      // Simulate email sending
      this.status = "acknowledged";
      return {
        success: true,
        message: `Email alerts sent to ${this.emailAddresses.length} contacts`,
      };
    } catch (error) {
      this.status = "pending";
      return { success: false, message: "Failed to send email alerts" };
    }
  }
}

// INHERITANCE: AuthorityAlert extends Alert
export class AuthorityAlert extends Alert {
  private authorityType: string;

  constructor(
    userId: string,
    type: AlertType,
    message: string,
    location: { lat: number; lng: number } | null,
    locationAddress: string
  ) {
    super(userId, type, message, location, locationAddress);
    this.authorityType = this.determineAuthority(type);
  }

  private determineAuthority(type: AlertType): string {
    const authorities = {
      medical: "911 Medical",
      fire: "Fire Department",
      police: "Police Department",
      general: "Emergency Services",
    };
    return authorities[type];
  }

  // POLYMORPHISM: Overriding sendAlert() for Authority-specific logic
  async sendAlert(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🚨 Notifying ${this.authorityType}`);
      // Create alert in database
      const { data: alertData, error: alertError } = await supabase
        .from("alerts")
        .insert([this.toDatabase()])
        .select()
        .single();

      if (alertError) throw alertError;

      // Call edge function to notify authorities
      await supabase.functions.invoke("notify-emergency", {
        body: { alertId: alertData.id },
      });

      this.status = "acknowledged";
      return {
        success: true,
        message: `${this.authorityType} has been notified`,
      };
    } catch (error) {
      this.status = "pending";
      return { success: false, message: "Failed to notify authorities" };
    }
  }
}

// INHERITANCE: PushNotificationAlert extends Alert
export class PushNotificationAlert extends Alert {
  private deviceTokens: string[];

  constructor(
    userId: string,
    type: AlertType,
    message: string,
    location: { lat: number; lng: number } | null,
    locationAddress: string,
    deviceTokens: string[]
  ) {
    super(userId, type, message, location, locationAddress);
    this.deviceTokens = deviceTokens;
  }

  // POLYMORPHISM: Overriding sendAlert() for Push Notification logic
  async sendAlert(): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔔 Sending push notifications to ${this.deviceTokens.length} devices`);
      // Simulate push notification
      this.status = "acknowledged";
      return {
        success: true,
        message: `Push notifications sent to ${this.deviceTokens.length} devices`,
      };
    } catch (error) {
      this.status = "pending";
      return { success: false, message: "Failed to send push notifications" };
    }
  }
}
