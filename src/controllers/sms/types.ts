// Interfaces for type safety
export interface SMSConfig {
   id: number;
  tenantId: number;
  partnerId: string; // Incorrect casing
  apiKey: string;   // Incorrect casing
  shortCode: string;
  customerSupportPhoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMSMessage {
  mobile: string;
  message: string;
}

export interface SMSPayload {
  apikey: string;
  partnerID: string;
  message: string;
  shortcode: string;
  mobile: string;
}

export interface SMSResponse {
  status: string;
  message: string;
  // Add other fields based on your SMS provider's response
}