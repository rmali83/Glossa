export const mockUser = {
    uid: "demo_translator_001",
    fullName: "Muhammad Ali",
    email: "translator@glossa.com",
    role: "translator",
    languages: ["English → Urdu", "Turkish → English"],
    timeZone: "Asia/Karachi"
};

export const statsCards = [
    { label: "Available Jobs", value: 12, icon: "briefcase" },
    { label: "Active Jobs", value: 3, icon: "clock" },
    { label: "Completed Jobs", value: 145, icon: "check-circle" },
    { label: "Earnings", value: "$4,250", icon: "dollar-sign" }
];

export const recentActivity = [
    { id: 1, type: "job_completed", text: "Completed 'Technical Manual' translation (EN-UR)", time: "2 hours ago" },
    { id: 2, type: "payment_received", text: "Received payment for Job #3452", time: "5 hours ago" },
    { id: 3, type: "job_accepted", text: "Accepted 'Medical Report' (TR-EN)", time: "1 day ago" },
    { id: 4, type: "profile_updated", text: "Updated language pairs", time: "2 days ago" }
];

export const mockJobs = [
    {
        id: "JOB-7823",
        pair: "English → Urdu",
        wordCount: 2500,
        deadline: "2026-02-10",
        status: "available",
        budget: "$150"
    },
    {
        id: "JOB-9912",
        pair: "Turkish → English",
        wordCount: 1200,
        deadline: "2026-02-05",
        status: "active",
        budget: "$80"
    },
    {
        id: "JOB-4432",
        pair: "English → Urdu",
        wordCount: 5000,
        deadline: "2026-01-28",
        status: "completed",
        budget: "$300"
    }
];

export const paymentHistory = [
    { id: "PAY-001", date: "2026-01-15", amount: "$450.00", status: "Paid", method: "Bank Transfer" },
    { id: "PAY-002", date: "2026-01-28", amount: "$320.00", status: "Paid", method: "PayPal" },
    { id: "PAY-003", date: "2026-02-01", amount: "$150.00", status: "Pending", method: "Bank Transfer" }
];
