/**
 * EMERGENCY CONTACT SYSTEM - C++ OOP IMPLEMENTATION
 * 
 * This file demonstrates all Object-Oriented Programming concepts:
 * 1. Class & Object
 * 2. Encapsulation
 * 3. Abstraction
 * 4. Inheritance
 * 5. Polymorphism
 * 6. File Handling
 */

#include <iostream>
#include <string>
#include <vector>
#include <fstream>
#include <ctime>
#include <memory>
#include <map>

using namespace std;

// ==================== ENCAPSULATION EXAMPLE ====================
// Location class with private members and public getters/setters
class Location {
private:
    double latitude;
    double longitude;
    string address;

public:
    // Constructor
    Location(double lat = 0.0, double lng = 0.0, string addr = "Unknown") 
        : latitude(lat), longitude(lng), address(addr) {}
    
    // ENCAPSULATION: Getters (read-only access)
    double getLatitude() const { return latitude; }
    double getLongitude() const { return longitude; }
    string getAddress() const { return address; }
    
    // ENCAPSULATION: Setters (controlled write access)
    void setLatitude(double lat) { latitude = lat; }
    void setLongitude(double lng) { longitude = lng; }
    void setAddress(const string& addr) { address = addr; }
    
    // Display location
    void display() const {
        cout << "Location: " << address << " (" << latitude << ", " << longitude << ")" << endl;
    }
};

// ==================== ABSTRACTION EXAMPLE ====================
// Abstract base class for Alert - defines interface without implementation
class Alert {
protected:
    string id;
    string userId;
    string type;
    string message;
    string status;
    time_t timestamp;
    Location location;

public:
    // Constructor
    Alert(string uid, string t, string msg, Location loc) 
        : userId(uid), type(t), message(msg), status("pending"), location(loc) {
        timestamp = time(0);
        id = to_string(timestamp) + "_" + uid;
    }
    
    // Virtual destructor for proper cleanup
    virtual ~Alert() {}
    
    // ABSTRACTION: Pure virtual function - must be implemented by derived classes
    virtual bool sendAlert() = 0;
    
    // ABSTRACTION: Pure virtual function for alert-specific details
    virtual string getAlertDetails() = 0;
    
    // Common method available to all alert types
    void displaySummary() {
        cout << "\n=== Alert Summary ===" << endl;
        cout << "ID: " << id << endl;
        cout << "Type: " << type << endl;
        cout << "Message: " << message << endl;
        cout << "Status: " << status << endl;
        cout << "Time: " << ctime(&timestamp);
        location.display();
    }
    
    // Getters
    string getId() const { return id; }
    string getType() const { return type; }
    string getMessage() const { return message; }
    string getStatus() const { return status; }
    
    // Setters
    void setStatus(const string& s) { status = s; }
};

// ==================== INHERITANCE & POLYMORPHISM EXAMPLES ====================

// INHERITANCE: SMSAlert inherits from Alert
class SMSAlert : public Alert {
private:
    vector<string> phoneNumbers;

public:
    SMSAlert(string uid, string msg, Location loc, vector<string> phones)
        : Alert(uid, "SMS", msg, loc), phoneNumbers(phones) {}
    
    // POLYMORPHISM: Override sendAlert method
    bool sendAlert() override {
        cout << "\n[SMS Alert] Sending SMS to " << phoneNumbers.size() << " contacts..." << endl;
        for (const auto& phone : phoneNumbers) {
            cout << "  → Sending SMS to: " << phone << endl;
            cout << "    Message: " << message << endl;
        }
        status = "sent";
        return true;
    }
    
    // POLYMORPHISM: Override getAlertDetails
    string getAlertDetails() override {
        return "SMS Alert sent to " + to_string(phoneNumbers.size()) + " contacts";
    }
    
    void addPhoneNumber(const string& phone) {
        phoneNumbers.push_back(phone);
    }
};

// INHERITANCE: EmailAlert inherits from Alert
class EmailAlert : public Alert {
private:
    vector<string> emailAddresses;
    string subject;

public:
    EmailAlert(string uid, string msg, Location loc, vector<string> emails)
        : Alert(uid, "Email", msg, loc), emailAddresses(emails), subject("EMERGENCY ALERT") {}
    
    // POLYMORPHISM: Override sendAlert method
    bool sendAlert() override {
        cout << "\n[Email Alert] Sending emails to " << emailAddresses.size() << " contacts..." << endl;
        for (const auto& email : emailAddresses) {
            cout << "  → Sending email to: " << email << endl;
            cout << "    Subject: " << subject << endl;
            cout << "    Body: " << message << endl;
        }
        status = "sent";
        return true;
    }
    
    // POLYMORPHISM: Override getAlertDetails
    string getAlertDetails() override {
        return "Email Alert sent to " + to_string(emailAddresses.size()) + " recipients";
    }
    
    void setSubject(const string& subj) { subject = subj; }
};

// INHERITANCE: AuthorityAlert inherits from Alert
class AuthorityAlert : public Alert {
private:
    string authorityType; // "police", "fire", "medical"
    string emergencyNumber;
    int severity; // 1-5 scale

public:
    AuthorityAlert(string uid, string msg, Location loc, string authType)
        : Alert(uid, "Authority", msg, loc), authorityType(authType), severity(5) {
        // Assign emergency numbers based on authority type
        if (authType == "police") emergencyNumber = "911";
        else if (authType == "fire") emergencyNumber = "911";
        else if (authType == "medical") emergencyNumber = "911";
    }
    
    // POLYMORPHISM: Override sendAlert method
    bool sendAlert() override {
        cout << "\n[Authority Alert] Contacting " << authorityType << " services..." << endl;
        cout << "  → Emergency Number: " << emergencyNumber << endl;
        cout << "  → Severity Level: " << severity << "/5" << endl;
        cout << "  → Message: " << message << endl;
        cout << "  → Dispatching emergency services to location..." << endl;
        location.display();
        status = "dispatched";
        return true;
    }
    
    // POLYMORPHISM: Override getAlertDetails
    string getAlertDetails() override {
        return "Authority Alert - " + authorityType + " services dispatched (Severity: " + 
               to_string(severity) + "/5)";
    }
    
    void setSeverity(int sev) { 
        severity = (sev >= 1 && sev <= 5) ? sev : 5; 
    }
};

// INHERITANCE: PushNotificationAlert inherits from Alert
class PushNotificationAlert : public Alert {
private:
    vector<string> deviceTokens;
    string notificationTitle;

public:
    PushNotificationAlert(string uid, string msg, Location loc, vector<string> tokens)
        : Alert(uid, "Push", msg, loc), deviceTokens(tokens), notificationTitle("🚨 EMERGENCY") {}
    
    // POLYMORPHISM: Override sendAlert method
    bool sendAlert() override {
        cout << "\n[Push Notification] Sending push notifications to " << deviceTokens.size() << " devices..." << endl;
        for (const auto& token : deviceTokens) {
            cout << "  → Device Token: " << token.substr(0, 10) << "..." << endl;
            cout << "    Title: " << notificationTitle << endl;
            cout << "    Body: " << message << endl;
        }
        status = "delivered";
        return true;
    }
    
    // POLYMORPHISM: Override getAlertDetails
    string getAlertDetails() override {
        return "Push Notification sent to " + to_string(deviceTokens.size()) + " devices";
    }
};

// ==================== FILE HANDLING EXAMPLE ====================
class FileHandler {
private:
    string filename;

public:
    FileHandler(string fname) : filename(fname) {}
    
    // FILE HANDLING: Write emergency log to file
    bool writeEmergencyLog(const Alert& alert) {
        ofstream outFile(filename, ios::app); // Append mode
        
        if (!outFile.is_open()) {
            cerr << "Error: Could not open file for writing: " << filename << endl;
            return false;
        }
        
        outFile << "==================== EMERGENCY LOG ====================" << endl;
        outFile << "Alert ID: " << alert.getId() << endl;
        outFile << "Type: " << alert.getType() << endl;
        outFile << "Status: " << alert.getStatus() << endl;
        outFile << "Message: " << alert.getMessage() << endl;
        outFile << "Timestamp: " << time(0) << endl;
        outFile << "=======================================================" << endl;
        outFile << endl;
        
        outFile.close();
        cout << "\n✓ Emergency log saved to file: " << filename << endl;
        return true;
    }
    
    // FILE HANDLING: Read emergency logs from file
    void readEmergencyLogs() {
        ifstream inFile(filename);
        
        if (!inFile.is_open()) {
            cerr << "Error: Could not open file for reading: " << filename << endl;
            return;
        }
        
        cout << "\n\n========== READING EMERGENCY LOGS FROM FILE ==========" << endl;
        string line;
        while (getline(inFile, line)) {
            cout << line << endl;
        }
        cout << "=======================================================" << endl;
        
        inFile.close();
    }
    
    // FILE HANDLING: Clear all logs
    bool clearLogs() {
        ofstream outFile(filename, ios::trunc); // Truncate mode
        if (!outFile.is_open()) {
            return false;
        }
        outFile.close();
        cout << "\n✓ All logs cleared from: " << filename << endl;
        return true;
    }
};

// ==================== CLASS & OBJECT EXAMPLES ====================

// Contact class - represents an emergency contact
class Contact {
private:
    string id;
    string name;
    string phone;
    string email;
    string relation;
    string address;

public:
    Contact(string n, string p, string e, string r, string addr)
        : name(n), phone(p), email(e), relation(r), address(addr) {
        id = to_string(time(0)) + "_" + n;
    }
    
    // Getters
    string getId() const { return id; }
    string getName() const { return name; }
    string getPhone() const { return phone; }
    string getEmail() const { return email; }
    string getRelation() const { return relation; }
    string getAddress() const { return address; }
    
    void display() const {
        cout << "\n--- Contact Info ---" << endl;
        cout << "Name: " << name << endl;
        cout << "Phone: " << phone << endl;
        cout << "Email: " << email << endl;
        cout << "Relation: " << relation << endl;
        cout << "Address: " << address << endl;
    }
};

// User class - represents a system user
class User {
private:
    string userId;
    string name;
    string email;
    string phone;
    string password; // In real system, this would be hashed
    vector<Contact> contacts;

public:
    User(string n, string e, string p, string pass)
        : name(n), email(e), phone(p), password(pass) {
        userId = to_string(time(0)) + "_user";
    }
    
    // Add contact
    void addContact(const Contact& contact) {
        contacts.push_back(contact);
        cout << "✓ Contact added: " << contact.getName() << endl;
    }
    
    // Get all contacts
    vector<Contact> getContacts() const { return contacts; }
    
    // Getters
    string getUserId() const { return userId; }
    string getName() const { return name; }
    string getEmail() const { return email; }
    string getPhone() const { return phone; }
    
    void displayProfile() const {
        cout << "\n========== USER PROFILE ==========" << endl;
        cout << "User ID: " << userId << endl;
        cout << "Name: " << name << endl;
        cout << "Email: " << email << endl;
        cout << "Phone: " << phone << endl;
        cout << "Total Contacts: " << contacts.size() << endl;
        cout << "==================================" << endl;
    }
};

// ==================== DEMONSTRATION OF POLYMORPHISM ====================
void demonstratePolymorphism(vector<shared_ptr<Alert>>& alerts) {
    cout << "\n\n========== DEMONSTRATING POLYMORPHISM ==========" << endl;
    cout << "Sending different types of alerts using same interface..." << endl;
    
    // POLYMORPHISM: Calling the same method on different object types
    for (auto& alert : alerts) {
        alert->sendAlert(); // Different behavior based on actual object type
        cout << alert->getAlertDetails() << endl;
    }
}

// ==================== MAIN FUNCTION ====================
int main() {
    cout << "╔════════════════════════════════════════════════════════╗" << endl;
    cout << "║   EMERGENCY CONTACT SYSTEM - OOP IMPLEMENTATION        ║" << endl;
    cout << "║   Demonstrating: Classes, Encapsulation, Abstraction,  ║" << endl;
    cout << "║   Inheritance, Polymorphism, and File Handling         ║" << endl;
    cout << "╚════════════════════════════════════════════════════════╝" << endl;
    
    // CLASS & OBJECT: Creating user object
    cout << "\n\n========== 1. CLASS & OBJECT DEMONSTRATION ==========" << endl;
    User user("John Doe", "john.doe@email.com", "+1234567890", "securepass123");
    user.displayProfile();
    
    // Creating contact objects
    Contact contact1("Jane Doe", "+1234567891", "jane@email.com", "Sister", "123 Main St");
    Contact contact2("Dr. Smith", "+1234567892", "dr.smith@hospital.com", "Doctor", "Hospital Ave");
    Contact contact3("Mom", "+1234567893", "mom@email.com", "Mother", "456 Oak St");
    
    user.addContact(contact1);
    user.addContact(contact2);
    user.addContact(contact3);
    
    contact1.display();
    
    // ENCAPSULATION: Creating location with private data
    cout << "\n\n========== 2. ENCAPSULATION DEMONSTRATION ==========" << endl;
    Location emergencyLocation(40.7128, -74.0060, "Times Square, New York");
    cout << "Accessing private data through public getters:" << endl;
    emergencyLocation.display();
    
    // ABSTRACTION & INHERITANCE: Creating different alert types
    cout << "\n\n========== 3. ABSTRACTION & INHERITANCE ==========" << endl;
    
    // Creating different types of alerts (all inherit from Alert base class)
    vector<shared_ptr<Alert>> alerts;
    
    alerts.push_back(make_shared<SMSAlert>(
        user.getUserId(),
        "EMERGENCY! I need help at Times Square!",
        emergencyLocation,
        vector<string>{"+1234567891", "+1234567893"}
    ));
    
    alerts.push_back(make_shared<EmailAlert>(
        user.getUserId(),
        "URGENT: Emergency situation. Please check your phone!",
        emergencyLocation,
        vector<string>{"jane@email.com", "mom@email.com"}
    ));
    
    alerts.push_back(make_shared<AuthorityAlert>(
        user.getUserId(),
        "Medical emergency reported at Times Square",
        emergencyLocation,
        "medical"
    ));
    
    alerts.push_back(make_shared<PushNotificationAlert>(
        user.getUserId(),
        "Emergency alert triggered! Tap to view details.",
        emergencyLocation,
        vector<string>{"token_abc123", "token_def456"}
    ));
    
    // POLYMORPHISM: Demonstrating method overriding
    cout << "\n\n========== 4. POLYMORPHISM DEMONSTRATION ==========" << endl;
    demonstratePolymorphism(alerts);
    
    // Display all alert summaries
    cout << "\n\n========== ALERT SUMMARIES ==========" << endl;
    for (const auto& alert : alerts) {
        alert->displaySummary();
    }
    
    // FILE HANDLING: Writing and reading logs
    cout << "\n\n========== 5. FILE HANDLING DEMONSTRATION ==========" << endl;
    FileHandler fileHandler("emergency_logs.txt");
    
    // Write all alerts to file
    for (const auto& alert : alerts) {
        fileHandler.writeEmergencyLog(*alert);
    }
    
    // Read logs from file
    fileHandler.readEmergencyLogs();
    
    // Final summary
    cout << "\n\n╔════════════════════════════════════════════════════════╗" << endl;
    cout << "║              OOP CONCEPTS DEMONSTRATED:                ║" << endl;
    cout << "║                                                        ║" << endl;
    cout << "║  ✓ Class & Object: User, Contact, Alert classes       ║" << endl;
    cout << "║  ✓ Encapsulation: Private members with getters        ║" << endl;
    cout << "║  ✓ Abstraction: Abstract Alert base class             ║" << endl;
    cout << "║  ✓ Inheritance: SMS, Email, Authority alerts          ║" << endl;
    cout << "║  ✓ Polymorphism: Overridden sendAlert() methods       ║" << endl;
    cout << "║  ✓ File Handling: Reading/writing emergency logs      ║" << endl;
    cout << "╚════════════════════════════════════════════════════════╝" << endl;
    
    return 0;
}

/**
 * COMPILATION AND EXECUTION:
 * 
 * To compile this C++ program:
 *   g++ -std=c++14 oop-code.cpp -o emergency-system
 * 
 * To run:
 *   ./emergency-system
 * 
 * Output will demonstrate all OOP concepts with a working emergency contact system.
 */
