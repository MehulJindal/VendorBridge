export const MOCK_VENDORS = [
  { id: "V001", name: "TechSupplies India Pvt. Ltd.", gst: "27AABCT1234D1Z5", category: "Electronics", rating: 4.8, status: "active", contact: "Raj Sharma", email: "raj@techsupplies.in", phone: "+91 98201 45678", city: "Mumbai", spend: 2840000, onTime: 96, orders: 142 },
  { id: "V002", name: "Industrial Components Co.", gst: "29AABCI5678E2Z3", category: "Mechanical", rating: 4.2, status: "active", contact: "Priya Nair", email: "priya@indcomp.co", phone: "+91 80761 23456", city: "Bangalore", spend: 1920000, onTime: 88, orders: 98 },
  { id: "V003", name: "OfficeWorks Solutions", gst: "07AABCO9012F3Z1", category: "Stationery", rating: 4.5, status: "active", contact: "Amit Verma", email: "amit@officeworks.in", phone: "+91 11201 78901", city: "Delhi", spend: 540000, onTime: 94, orders: 234 },
  { id: "V004", name: "SafeGuard Equipment Ltd.", gst: "33AABCS3456G4Z8", category: "Safety", rating: 3.9, status: "active", contact: "Kavitha R.", email: "kavitha@safeguard.co", phone: "+91 44301 56789", city: "Chennai", spend: 860000, onTime: 79, orders: 67 },
  { id: "V005", name: "GlobalTech Imports", gst: "22AABCG7890H5Z6", category: "Electronics", rating: 4.1, status: "inactive", contact: "Suresh Mehta", email: "suresh@globaltech.in", phone: "+91 79401 34567", city: "Ahmedabad", spend: 320000, onTime: 71, orders: 23 },
  { id: "V006", name: "Prime Logistics Network", gst: "19AABCP2345I6Z4", category: "Logistics", rating: 4.6, status: "active", contact: "Neha Singh", email: "neha@primelogistics.in", phone: "+91 33501 90123", city: "Kolkata", spend: 1150000, onTime: 97, orders: 189 },
  { id: "V007", name: "BuildRight Materials", gst: "24AABCB6789J7Z2", category: "Construction", rating: 3.7, status: "inactive", contact: "Rohit Gupta", email: "rohit@buildright.in", phone: "+91 26601 12345", city: "Surat", spend: 780000, onTime: 68, orders: 45 },
  { id: "V008", name: "MediCore Pharma Supplies", gst: "36AABCM1234K8Z9", category: "Medical", rating: 4.9, status: "active", contact: "Dr. Anita Rao", email: "anita@medicore.in", phone: "+91 40701 67890", city: "Hyderabad", spend: 3210000, onTime: 99, orders: 312 },
];

export const MOCK_RFQS = [
  { id: "RFQ-2024-0087", title: "Laptop Procurement Q4", category: "Electronics", createdDate: "2024-11-15", deadline: "2024-11-22", status: "bidding", vendors: 5, responses: 3, estimatedValue: 450000 },
  { id: "RFQ-2024-0088", title: "Office Furniture Refresh", category: "Furniture", createdDate: "2024-11-14", deadline: "2024-11-21", status: "pending_approval", vendors: 3, responses: 3, estimatedValue: 125000 },
  { id: "RFQ-2024-0089", title: "Server Infrastructure Upgrade", category: "IT Infrastructure", createdDate: "2024-11-12", deadline: "2024-11-26", status: "draft", vendors: 0, responses: 0, estimatedValue: 1200000 },
  { id: "RFQ-2024-0086", title: "Safety Equipment Annual", category: "Safety", createdDate: "2024-11-08", deadline: "2024-11-18", status: "approved", vendors: 4, responses: 4, estimatedValue: 89000 },
  { id: "RFQ-2024-0085", title: "Cleaning Supplies Q4", category: "Consumables", createdDate: "2024-11-05", deadline: "2024-11-15", status: "closed", vendors: 6, responses: 5, estimatedValue: 34000 },
];

export const MOCK_QUOTATIONS = [
  { id: "Q001", rfqId: "RFQ-2024-0087", vendor: "TechSupplies India Pvt. Ltd.", vendorId: "V001", unitPrice: 68500, qty: 50, total: 3425000, gstRate: 18, deliveryDays: 7, warranty: "3 Years", comment: "Bulk discount applied. All units ISI certified.", status: "submitted", submittedAt: "2024-11-16 09:30" },
  { id: "Q002", rfqId: "RFQ-2024-0087", vendor: "GlobalTech Imports", vendorId: "V005", unitPrice: 65200, qty: 50, total: 3260000, gstRate: 18, deliveryDays: 12, warranty: "2 Years", comment: "Direct import pricing. Limited warranty period.", status: "submitted", submittedAt: "2024-11-16 11:45" },
  { id: "Q003", rfqId: "RFQ-2024-0087", vendor: "Industrial Components Co.", vendorId: "V002", unitPrice: 71000, qty: 50, total: 3550000, gstRate: 18, deliveryDays: 5, warranty: "3 Years", comment: "Premium service with on-site support included.", status: "submitted", submittedAt: "2024-11-17 08:15" },
];

export const MOCK_APPROVALS = [
  {
    id: "APR-0087", rfqTitle: "Laptop Procurement Q4", rfqId: "RFQ-2024-0087",
    requestedBy: "Vikram Tiwari", requestedAt: "2024-11-17", amount: 3260000,
    selectedVendor: "GlobalTech Imports",
    steps: [
      { step: 1, title: "RFQ Created", role: "Procurement Officer", actor: "Vikram Tiwari", status: "completed", timestamp: "2024-11-15 10:00", comment: "RFQ issued to 5 vendors." },
      { step: 2, title: "Bidding Closed", role: "System", actor: "System", status: "completed", timestamp: "2024-11-17 00:00", comment: "3 of 5 vendors responded." },
      { step: 3, title: "Comparative Analysis", role: "Procurement Officer", actor: "Vikram Tiwari", status: "completed", timestamp: "2024-11-17 14:30", comment: "GlobalTech recommended for cost efficiency." },
      { step: 4, title: "Manager Review", role: "Purchase Manager", actor: "Sunita Kapoor", status: "pending", timestamp: null, comment: "" },
      { step: 5, title: "CFO Approval", role: "CFO", actor: "Arjun Malhotra", status: "waiting", timestamp: null, comment: "" },
      { step: 6, title: "PO Issued", role: "System", actor: "System", status: "waiting", timestamp: null, comment: "" },
    ]
  }
];

export const MOCK_ACTIVITY_LOGS = [
  { id: 1, user: "Vikram Tiwari", role: "Procurement Officer", action: "Created RFQ-2024-0089 (Server Infrastructure)", module: "RFQ", severity: "info", timestamp: "2024-11-17 16:45:23" },
  { id: 2, user: "TechSupplies India", role: "Vendor", action: "Submitted quotation Q001 for RFQ-2024-0087", module: "Quotation", severity: "success", timestamp: "2024-11-17 15:30:11" },
  { id: 3, user: "Sunita Kapoor", role: "Purchase Manager", action: "Requested clarification on APR-0087", module: "Approval", severity: "warning", timestamp: "2024-11-17 14:55:00" },
  { id: 4, user: "GlobalTech Imports", role: "Vendor", action: "Submitted quotation Q002 for RFQ-2024-0087", module: "Quotation", severity: "success", timestamp: "2024-11-17 13:45:44" },
  { id: 5, user: "System", role: "Automated", action: "RFQ-2024-0085 deadline passed — bidding auto-closed", module: "System", severity: "info", timestamp: "2024-11-15 23:59:59" },
  { id: 6, user: "Arjun Malhotra", role: "CFO", action: "Approved RFQ-2024-0086 — PO issued", module: "Approval", severity: "success", timestamp: "2024-11-14 11:30:00" },
  { id: 7, user: "Rohit Gupta", role: "Vendor", action: "Login attempt failed (3x) — account locked", module: "Auth", severity: "error", timestamp: "2024-11-13 08:15:22" },
  { id: 8, user: "Admin", role: "System Admin", action: "Vendor V007 status set to INACTIVE", module: "Vendor", severity: "warning", timestamp: "2024-11-12 17:00:00" },
  { id: 9, user: "Vikram Tiwari", role: "Procurement Officer", action: "Downloaded comparative analysis report for RFQ-2024-0087", module: "Reports", severity: "info", timestamp: "2024-11-12 16:30:15" },
  { id: 10, user: "Industrial Components Co.", role: "Vendor", action: "Submitted quotation Q003 for RFQ-2024-0087", module: "Quotation", severity: "success", timestamp: "2024-11-17 08:15:30" },
];

export const MOCK_SPEND_MONTHLY = [
  { month: "Jun", value: 3200000, pct: 62 }, { month: "Jul", value: 2800000, pct: 54 },
  { month: "Aug", value: 4100000, pct: 79 }, { month: "Sep", value: 3600000, pct: 69 },
  { month: "Oct", value: 5200000, pct: 100 }, { month: "Nov", value: 3800000, pct: 73 },
];

export const MOCK_PO = {
  id: "PO-2024-0064", rfqId: "RFQ-2024-0086", date: "2024-11-14",
  vendor: { name: "SafeGuard Equipment Ltd.", gst: "33AABCS3456G4Z8", address: "14, Industrial Estate, Ambattur, Chennai - 600058", contact: "Kavitha R.", email: "kavitha@safeguard.co" },
  buyer: { name: "VendorBridge Corp Pvt. Ltd.", gst: "27AABCV4567L9Z3", address: "Suite 1402, World Trade Centre, Cuffe Parade, Mumbai - 400005", contact: "Vikram Tiwari" },
  items: [
    { desc: "Industrial Safety Helmet (IS 2925)", qty: 100, unit: "Nos", rate: 450, gstRate: 18 },
    { desc: "Safety Harness Full Body (EN 361)", qty: 50, unit: "Nos", rate: 1200, gstRate: 18 },
    { desc: "Fire Extinguisher 5kg (ABC Dry Powder)", qty: 25, unit: "Nos", rate: 1800, gstRate: 18 },
    { desc: "High Visibility Vest (IS 15809)", qty: 200, unit: "Nos", rate: 180, gstRate: 5 },
  ],
  paymentTerms: "Net 30 Days", deliveryDate: "2024-11-20", deliveryAddress: "Same as buyer address"
};