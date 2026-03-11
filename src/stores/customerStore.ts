// Shared customer storage using localStorage for persistence
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  meeting_preferences?: string;
  notes?: string;
  created_at: string;
  last_contact?: string;
  status: 'active' | 'inactive';
  custom_message?: string;
}

const CUSTOMERS_KEY = 'voice_agent_customers';

export const customerStore = {
  // Get all customers from localStorage
  getCustomers(): Customer[] {
    try {
      const stored = localStorage.getItem(CUSTOMERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Save customers to localStorage
  saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    } catch (error) {
      console.error('Failed to save customers:', error);
    }
  },

  // Add a new customer
  addCustomer(customerData: Omit<Customer, 'id' | 'created_at' | 'status'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      id: Date.now().toString(),
      ...customerData,
      created_at: new Date().toISOString(),
      status: 'active'
    };
    
    customers.push(newCustomer);
    this.saveCustomers(customers);
    return newCustomer;
  },

  // Add multiple customers (from PDF processing)
  addMultipleCustomers(customersData: Omit<Customer, 'id' | 'created_at' | 'status'>[]): Customer[] {
    const customers = this.getCustomers();
    const newCustomers: Customer[] = customersData.map(customerData => ({
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
      ...customerData,
      created_at: new Date().toISOString(),
      status: 'active' as const
    }));
    
    customers.push(...newCustomers);
    this.saveCustomers(customers);
    return newCustomers;
  },

  // Delete a customer
  deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter(c => c.id !== id);
    this.saveCustomers(customers);
  },

  // Update customer's last contact
  updateLastContact(id: string): void {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === id);
    if (customer) {
      customer.last_contact = new Date().toISOString().split('T')[0];
      this.saveCustomers(customers);
    }
  },

  // Update customer's custom message
  updateCustomMessage(id: string, customMessage: string): void {
    const customers = this.getCustomers();
    const customer = customers.find(c => c.id === id);
    if (customer) {
      customer.custom_message = customMessage;
      this.saveCustomers(customers);
    }
  },

  // Update customer data
  updateCustomer(id: string, updates: Partial<Customer>): void {
    const customers = this.getCustomers();
    const customerIndex = customers.findIndex(c => c.id === id);
    if (customerIndex !== -1) {
      customers[customerIndex] = { ...customers[customerIndex], ...updates };
      this.saveCustomers(customers);
    }
  }
};