/**
 * BASE CLASS for Alert System - Demonstrates OOP Concepts:
 * - Class & Object: Blueprint for creating alert instances
 * - Encapsulation: Private properties with public getters/setters
 * - Abstraction: Abstract method sendAlert() must be implemented by child classes
 * - Polymorphism: Child classes override sendAlert() with their own implementation
 */

export type AlertType = "medical" | "fire" | "police" | "general";
export type AlertStatus = "pending" | "acknowledged" | "resolved";

export abstract class Alert {
  // ENCAPSULATION: Private properties
  private _id: string;
  private _userId: string;
  private _type: AlertType;
  private _message: string;
  private _status: AlertStatus;
  private _timestamp: Date;
  private _location: { lat: number; lng: number } | null;
  private _locationAddress: string;

  constructor(
    userId: string,
    type: AlertType,
    message: string,
    location: { lat: number; lng: number } | null,
    locationAddress: string
  ) {
    this._id = crypto.randomUUID();
    this._userId = userId;
    this._type = type;
    this._message = message;
    this._status = "pending";
    this._timestamp = new Date();
    this._location = location;
    this._locationAddress = locationAddress;
  }

  // ENCAPSULATION: Public getters (read-only access to private data)
  get id(): string {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get type(): AlertType {
    return this._type;
  }

  get message(): string {
    return this._message;
  }

  get status(): AlertStatus {
    return this._status;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get location(): { lat: number; lng: number } | null {
    return this._location;
  }

  get locationAddress(): string {
    return this._locationAddress;
  }

  // ENCAPSULATION: Public setters (controlled access to modify private data)
  set status(value: AlertStatus) {
    this._status = value;
  }

  set message(value: string) {
    this._message = value;
  }

  // ABSTRACTION: Abstract method - must be implemented by child classes
  // This forces all alert types to have their own sending mechanism
  abstract sendAlert(): Promise<{ success: boolean; message: string }>;

  // Common method available to all alert types
  getAlertSummary(): string {
    return `Alert [${this._type}] - ${this._message} at ${this._locationAddress}`;
  }

  // Convert to database format
  toDatabase() {
    return {
      user_id: this._userId,
      type: this._type,
      message: this._message,
      status: this._status,
      latitude: this._location?.lat,
      longitude: this._location?.lng,
      location_address: this._locationAddress,
    };
  }
}
