const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function api(path: string, opts: RequestInit = {}) {
  // include cookie credentials, and attach Authorization header from localStorage if present
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = new Headers(opts.headers as HeadersInit | undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let res = await fetch(`${API}/api${path}`, {
    credentials: "include",
    ...opts,
    headers,
  });
  // If the server returns 401 and we had an access_token in localStorage, it's likely stale/invalid.
  // Clear it and retry once without the Authorization header (rely on HttpOnly cookie session).
  if (res.status === 401 && token) {
    try {
      localStorage.removeItem("access_token");
    } catch {}
    // retry without Authorization header
    const retryHeaders = new Headers(opts.headers as HeadersInit | undefined);
    res = await fetch(`${API}/api${path}`, {
      credentials: "include",
      ...opts,
      headers: retryHeaders,
    });
  }

  if (!res.ok) {
    let errorMessage = `API ${path} failed: ${res.status}`;
    try {
      const errorData = await res.json();
      if (errorData.message) {
        errorMessage += ` - ${errorData.message}`;
      }
    } catch {
      // If we can't parse the error response, just use the status
    }
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function fetchMe() {
  return api("/auth/me");
}

export async function login(email: string, password: string) {
  return api("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name?: string, role?: 'CLIENT' | 'FREELANCER') {
  // Ensure role has a default value and is never undefined
  const finalRole = role || 'FREELANCER';
  const requestBody = { email, password, name, role: finalRole };
  console.log('🚀 Frontend API - Sending registration request:', requestBody);
  console.log('🚀 Frontend API - Request body keys:', Object.keys(requestBody));
  console.log('🚀 Frontend API - Role value:', finalRole, 'Type:', typeof finalRole);
  
  return api("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
}

export async function logout() {
  return api("/auth/logout", { method: "POST" });
}

export async function fetchInvoices() {
  return api("/invoices");
}

export async function fetchInvoice(id: string) {
  return api(`/invoices/${id}`);
}

export async function createInvoice(payload: {
  title: string;
  amount: number;
  clientId?: string;
  freelancerId?: string;
  dueDate?: string;
  currency?: string;
}) {
  return api("/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateInvoiceStatus(id: string, status: string) {
  return api(`/invoices/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

// ============================================================================
// ENHANCED BLOCKCHAIN INVOICE API FUNCTIONS
// ============================================================================

/**
 * Verify invoice integrity against blockchain
 * This checks if the local invoice hash matches the on-chain hash
 */
export async function verifyInvoiceIntegrity(invoiceId: string) {
  return api(`/invoices/${invoiceId}/verify`);
}

/**
 * Attach IPFS file to invoice
 * This stores the IPFS hash and links it to the blockchain NFT
 */
export async function attachInvoiceFile(
  invoiceId: string,
  fileData: {
    filename: string;
    ipfsHash: string;
    fileSize?: number;
  }
) {
  return api(`/invoices/${invoiceId}/files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fileData),
  });
}

/**
 * Mint simple invoice NFT (legacy method)
 */
export async function mintInvoiceNFTSimple(invoiceId: string) {
  return api(`/blockchain/mint-invoice/${invoiceId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Mint enhanced invoice NFT with complete metadata
 * This is called when an invoice is marked as PAID
 */
export async function mintInvoiceNFT(invoiceData: {
  invoiceId: string;
  invoiceHash: string;
  clientId: string;
  freelancerId: string;
  amount: number;
  currency: string;
}) {
  return api("/blockchain/mint-invoice-enhanced", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(invoiceData),
  });
}

/**
 * Get user's trust score from blockchain
 */
export async function getUserTrustScore(userId: string) {
  return api(`/blockchain/trust/${userId}`);
}

/**
 * Update user's trust score on blockchain
 */
export async function updateTrustScore(
  userId: string,
  scoreChange: number,
  reason: string
) {
  return api("/blockchain/trust/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, scoreChange, reason }),
  });
}

/**
 * Get blockchain transaction status
 */
export async function getBlockchainTransactionStatus(txHash: string) {
  return api(`/blockchain/transaction/${txHash}`);
}

/**
 * Upload file to IPFS (this would integrate with your IPFS service)
 */
export async function uploadToIPFS(
  file: File
): Promise<{ ipfsHash: string; fileSize: number }> {
  // This is a placeholder - you'll need to implement actual IPFS upload
  // For now, return mock data for development
  return {
    ipfsHash: `QmMockHash${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)}`,
    fileSize: file.size,
  };
}

export async function uploadStorage(
  invoiceId: string,
  filename: string,
  base64: string
) {
  return api("/storage/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId, filename, dataBase64: base64 }),
  });
}

export async function openDispute(
  invoiceId: string,
  openerId: string,
  reason: string
) {
  return api("/disputes/open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invoiceId, openerId, reason }),
  });
}

export async function voteDispute(
  disputeId: string,
  voterId: string,
  choice: "YES" | "NO" | "ABSTAIN"
) {
  return api(`/disputes/${disputeId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voterId, choice }),
  });
}

export async function resolveDispute(disputeId: string) {
  return api(`/disputes/${disputeId}/resolve`, { method: "POST" });
}

export async function validateInvoiceAI(invoiceId: string) {
  return api(`/ai/invoices/${invoiceId}/validate`);
}

export async function getReputation(userId: string) {
  return api(`/reputation/${userId}`);
}

export async function adjustReputation(userId: string, delta: number) {
  return api(`/reputation/${userId}/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
}

// Profile and work opportunity functions
export async function fetchUserProfiles(role?: "CLIENT" | "FREELANCER") {
  const query = role ? `?role=${role}` : "";
  return api(`/users/profiles${query}`);
}

export async function fetchUsers(role?: "CLIENT" | "FREELANCER") {
  const query = role ? `?role=${role}` : "";
  return api(`/users${query}`);
}

export async function fetchUserProfile(userId: string) {
  return api(`/users/${userId}`);
}

export async function fetchWorkOpportunities(filters?: {
  category?: string;
  difficulty?: string;
  minBudget?: number;
  maxBudget?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.difficulty) params.append("difficulty", filters.difficulty);
  if (filters?.minBudget)
    params.append("minBudget", filters.minBudget.toString());
  if (filters?.maxBudget)
    params.append("maxBudget", filters.maxBudget.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  return api(`/work-opportunities${query}`);
}

export async function fetchWorkOpportunity(id: string) {
  return api(`/work-opportunities/${id}`);
}

export async function createWorkOpportunity(data: {
  title: string;
  description: string;
  budget: number;
  currency?: string;
  difficulty?: string;
  skills: string[];
  deadline?: string;
  startDate?: string;
}) {
  return api("/work-opportunities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function applyToOpportunity(
  opportunityId: string,
  proposal: {
    coverLetter: string;
    proposedRate: number;
    estimatedHours: number;
    deliveryDate: string;
  }
) {
  return api(`/work-opportunities/${opportunityId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(proposal),
  });
}

export async function saveOpportunity(opportunityId: string) {
  return api(`/work-opportunities/${opportunityId}/save`, {
    method: "POST",
  });
}

export async function unsaveOpportunity(opportunityId: string) {
  return api(`/work-opportunities/${opportunityId}/save`, {
    method: "DELETE",
  });
}

export async function fetchAvailableTasks() {
  return api("/tasks/available");
}

// Services/Tasks API functions
export async function fetchServices(filters?: {
  category?: string;
  priceRange?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.priceRange) params.append("priceRange", filters.priceRange);

  const query = params.toString() ? `?${params.toString()}` : "";
  return api(`/tasks/available${query}`);
}

export async function fetchService(id: string) {
  // Since backend doesn't have individual service endpoint yet,
  // we'll fetch all services and find the one we need
  const services = await fetchServices();
  return services.find((service: Record<string, unknown>) => service.id === id);
}

export async function hireFreelancerForService(
  serviceId: string,
  freelancerId: string,
  details: {
    message: string;
    budget: number;
    timeline: string;
    requirements: string;
  }
) {
  return api("/services/hire", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serviceId, freelancerId, ...details }),
  });
}

export async function contactFreelancer(
  freelancerId: string,
  message: {
    subject: string;
    body: string;
    serviceId?: string;
  }
) {
  return api("/freelancers/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ freelancerId, ...message }),
  });
}

export async function requestCustomQuote(
  freelancerId: string,
  request: {
    serviceType: string;
    description: string;
    budget: number;
    timeline: string;
  }
) {
  return api("/services/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ freelancerId, ...request }),
  });
}

// Payment-related API functions
export async function createPaymentIntent(invoiceId: string) {
  return api(`/payments/create/${invoiceId}`, {
    method: "POST",
  });
}

export async function simulatePayment(invoiceId: string) {
  return api(`/payments/${invoiceId}/simulate-paid`, {
    method: "POST",
  });
}

export async function releaseEscrow(invoiceId: string) {
  return api(`/payments/${invoiceId}/release`, {
    method: "POST",
  });
}

// Placeholder functions for future backend implementation
export async function fetchPaymentHistory(userId?: string) {
  // TODO: Implement backend endpoint
  return api(`/payments/history${userId ? `?userId=${userId}` : ""}`);
}

export async function fetchCryptoWalletBalance(address: string) {
  // Mock data - in real implementation this would call a blockchain API
  return {
    address,
    balance: {
      apt: 145.67,
      usdc: 2850.42,
      workverse: 1200.0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchPaymentMethods(userId: string) {
  // TODO: Implement backend endpoint
  return api(`/payments/methods?userId=${userId}`);
}

export async function addPaymentMethod(
  userId: string,
  paymentMethodData: Record<string, unknown>
) {
  // TODO: Implement backend endpoint
  return api("/payments/methods", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...paymentMethodData }),
  });
}

export async function removePaymentMethod(paymentMethodId: string) {
  // TODO: Implement backend endpoint
  return api(`/payments/methods/${paymentMethodId}`, {
    method: "DELETE",
  });
}

export async function deletePaymentMethod(paymentMethodId: string) {
  return removePaymentMethod(paymentMethodId);
}

export async function updatePaymentMethod(
  methodId: string,
  updates: Record<string, unknown>
) {
  return api(`/payments/methods/${methodId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
}

export async function setDefaultPaymentMethod(methodId: string) {
  return api(`/payments/methods/${methodId}/default`, {
    method: "POST",
  });
}

export async function withdrawFunds(data: {
  amount: number;
  currency: string;
  method: string;
}) {
  return api("/payments/wallet/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function fetchPendingPayments() {
  return api("/payments/pending");
}

// Real-time communication API functions
export async function fetchChatConversations() {
  return api("/chat/conversations");
}

export async function fetchConversationMessages(
  conversationId: string,
  page = 1,
  limit = 50
) {
  return api(
    `/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
  );
}

export async function sendMessage(
  conversationId: string,
  messageData: {
    content: string;
    type?: "text" | "file" | "image";
    fileUrl?: string;
    fileName?: string;
  }
) {
  return api(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messageData),
  });
}

export async function createConversation(
  participantIds: string[],
  projectId?: string
) {
  return api("/chat/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantIds, projectId }),
  });
}

export async function markMessageAsRead(
  conversationId: string,
  messageId: string
) {
  return api(
    `/chat/conversations/${conversationId}/messages/${messageId}/read`,
    {
      method: "POST",
    }
  );
}

export async function fetchNotifications(unreadOnly = false) {
  return api(`/notifications${unreadOnly ? "?unread=true" : ""}`);
}

export async function markNotificationAsRead(notificationId: string) {
  return api(`/notifications/${notificationId}/read`, {
    method: "POST",
  });
}

export async function markAllNotificationsAsRead() {
  return api("/notifications/mark-all-read", {
    method: "POST",
  });
}

export async function uploadChatFile(file: File, conversationId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("conversationId", conversationId);

  return api("/chat/upload", {
    method: "POST",
    body: formData,
  });
}

// SSE connection for real-time updates
export function createSSEConnection(
  onMessage: (data: unknown) => void,
  onError?: (error: unknown) => void
) {
  const eventSource = new EventSource(`/api/realtime/events`, {
    withCredentials: true,
  });

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error("Error parsing SSE message:", error);
    }
  };

  eventSource.onerror = (error) => {
    console.error("SSE connection error:", error);
    if (onError) {
      onError(error);
    }
  };

  return eventSource;
}

export async function initiateWithdrawal(
  userId: string,
  amount: number,
  paymentMethodId: string
) {
  // TODO: Implement backend endpoint
  return api("/wallet/withdraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, amount, paymentMethodId }),
  });
}

// Skills API functions
export async function fetchSkills(category?: string) {
  const query = category ? `?category=${category}` : "";
  return api(`/skills${query}`);
}

export async function fetchSkillCategories() {
  return api("/skills/categories");
}

// Project Management API
export async function fetchProjects(
  role?: "client" | "freelancer" | "all",
  status?: string,
  limit?: number,
  offset?: number
) {
  const params = new URLSearchParams();
  if (role) params.append("role", role);
  if (status) params.append("status", status);
  if (limit) params.append("limit", limit.toString());
  if (offset) params.append("offset", offset.toString());

  const queryString = params.toString();
  return api(`/projects${queryString ? `?${queryString}` : ""}`);
}

export async function fetchProject(id: string) {
  return api(`/projects/${id}`);
}

export async function createProject(payload: {
  title: string;
  description: string;
  budget?: number;
  currency?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  deadline?: string;
  skillIds?: string[];
  freelancerId?: string;
}) {
  return api("/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateProject(
  id: string,
  payload: {
    title?: string;
    description?: string;
    budget?: number;
    actualCost?: number;
    currency?: string;
    status?: "PLANNING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    startDate?: string;
    endDate?: string;
    deadline?: string;
    freelancerId?: string;
  }
) {
  return api(`/projects/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function assignFreelancerToProject(
  projectId: string,
  freelancerId: string
) {
  return api(`/projects/${projectId}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ freelancerId }),
  });
}

export async function completeProject(projectId: string) {
  return api(`/projects/${projectId}/complete`, {
    method: "POST",
  });
}

export async function cancelProject(projectId: string, reason?: string) {
  return api(`/projects/${projectId}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

export async function searchProjects(
  query: string,
  filters?: {
    status?: string;
    minBudget?: number;
    maxBudget?: number;
    skills?: string[];
    difficulty?: string;
  }
) {
  const params = new URLSearchParams({ q: query });
  if (filters?.status) params.append("status", filters.status);
  if (filters?.minBudget)
    params.append("minBudget", filters.minBudget.toString());
  if (filters?.maxBudget)
    params.append("maxBudget", filters.maxBudget.toString());
  if (filters?.skills) params.append("skills", filters.skills.join(","));
  if (filters?.difficulty) params.append("difficulty", filters.difficulty);

  return api(`/projects/search?${params.toString()}`);
}

export async function fetchProjectStats() {
  return api("/projects/stats");
}

export async function fetchProjectMilestones(projectId: string) {
  return api(`/projects/${projectId}/milestones`);
}

export async function fetchProjectTimeEntries(projectId: string) {
  return api(`/projects/${projectId}/time-entries`);
}

// Reputation API functions
export async function fetchUserReputation(userId: string) {
  return api(`/reputation/${userId}`);
}

export async function adjustUserReputation(userId: string, delta: number) {
  return api(`/reputation/${userId}/adjust`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
}

export async function fetchUserReviews(userId: string) {
  // Mock implementation - replace with actual endpoint when available
  return {
    reviews: [
      {
        id: "1",
        projectId: "proj1",
        authorId: "auth1",
        targetId: userId,
        rating: 5,
        comment: "Excellent work! Delivered on time and exceeded expectations.",
        quality: 5,
        communication: 5,
        timeliness: 5,
        professionalism: 5,
        createdAt: "2024-01-15T10:00:00Z",
        project: { title: "E-commerce Website Development" },
        author: { name: "John Smith", profileImage: null },
      },
      {
        id: "2",
        projectId: "proj2",
        authorId: "auth2",
        targetId: userId,
        rating: 4,
        comment: "Great freelancer, good communication and quality work.",
        quality: 4,
        communication: 5,
        timeliness: 4,
        professionalism: 4,
        createdAt: "2024-01-10T14:30:00Z",
        project: { title: "Mobile App UI Design" },
        author: { name: "Sarah Wilson", profileImage: null },
      },
    ],
    stats: {
      totalReviews: 2,
      averageRating: 4.5,
      ratingDistribution: { 5: 1, 4: 1, 3: 0, 2: 0, 1: 0 },
    },
  };
}

export async function createReview(review: {
  projectId: string;
  targetId: string;
  rating: number;
  comment?: string;
  quality?: number;
  communication?: number;
  timeliness?: number;
  professionalism?: number;
}) {
  return api("/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
  });
}

// Dispute API functions
export async function fetchDisputes() {
  // return api('/disputes');

  // Mock data for development
  return {
    disputes: [
      {
        id: "1",
        invoiceId: "inv-001",
        openerId: "user-1",
        reason:
          "Work was not completed as specified in the project requirements",
        resolved: false,
        outcome: null,
        createdAt: new Date("2024-10-28").toISOString(),
        invoice: {
          id: "inv-001",
          title: "Website Development Project",
          amount: 2500,
          status: "DISPUTED",
        },
        opener: {
          id: "user-1",
          name: "John Smith",
          email: "john@example.com",
        },
        votes: [
          {
            id: "vote-1",
            userId: "user-2",
            vote: "FOR",
            createdAt: new Date("2024-10-29").toISOString(),
          },
          {
            id: "vote-2",
            userId: "user-3",
            vote: "AGAINST",
            createdAt: new Date("2024-10-29").toISOString(),
          },
        ],
      },
      {
        id: "2",
        invoiceId: "inv-002",
        openerId: "user-4",
        reason: "Payment delay without proper communication",
        resolved: true,
        outcome: "FOR",
        createdAt: new Date("2024-10-25").toISOString(),
        invoice: {
          id: "inv-002",
          title: "Mobile App Design",
          amount: 1800,
          status: "RESOLVED",
        },
        opener: {
          id: "user-4",
          name: "Sarah Johnson",
          email: "sarah@example.com",
        },
        votes: [
          {
            id: "vote-3",
            userId: "user-5",
            vote: "FOR",
            createdAt: new Date("2024-10-26").toISOString(),
          },
          {
            id: "vote-4",
            userId: "user-6",
            vote: "FOR",
            createdAt: new Date("2024-10-26").toISOString(),
          },
          {
            id: "vote-5",
            userId: "user-7",
            vote: "AGAINST",
            createdAt: new Date("2024-10-26").toISOString(),
          },
        ],
      },
    ],
  };
}

export async function fetchDispute(id: string) {
  // return api(`/disputes/${id}`);

  // Mock data for development
  const disputes = await fetchDisputes();
  return disputes.disputes.find((dispute) => dispute.id === id);
}

export async function voteOnDispute(
  disputeId: string,
  vote: {
    userId: string;
    vote: "for" | "against";
  }
) {
  return api(`/disputes/${disputeId}/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vote),
  });
}

// Blockchain API functions
export async function requestWalletChallenge(address: string) {
  return api("/blockchain/auth/request-challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
}

export async function verifyWalletSignature(
  address: string,
  signature: string,
  publicKey?: string
) {
  return api("/blockchain/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, signature, publicKey }),
  });
}

export async function mintReputationSBT(userId: string) {
  return api(`/blockchain/mint-sbt/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

export async function publishSmartContract() {
  return api("/blockchain/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

// Mock blockchain data for development
export async function fetchTransactionHistory(address: string) {
  // Mock data - in real implementation this would call a blockchain explorer API
  return {
    transactions: [
      {
        hash: "0x1234567890abcdef1234567890abcdef12345678",
        type: "NFT_MINT",
        amount: 0,
        token: "Invoice NFT #001",
        from: address,
        to: "0x0000000000000000000000000000000000000000",
        timestamp: new Date("2024-10-30").toISOString(),
        status: "confirmed",
        gasUsed: 0.001,
        description: "Minted invoice NFT for Website Development Project",
      },
      {
        hash: "0xabcdef1234567890abcdef1234567890abcdef12",
        type: "PAYMENT",
        amount: 2500,
        token: "USDC",
        from: "0x9876543210fedcba9876543210fedcba98765432",
        to: address,
        timestamp: new Date("2024-10-29").toISOString(),
        status: "confirmed",
        gasUsed: 0.0015,
        description: "Payment for completed freelance project",
      },
      {
        hash: "0x567890abcdef1234567890abcdef1234567890ab",
        type: "ESCROW_RELEASE",
        amount: 1800,
        token: "APT",
        from: "escrow_contract",
        to: address,
        timestamp: new Date("2024-10-28").toISOString(),
        status: "confirmed",
        gasUsed: 0.002,
        description: "Escrow funds released after project completion",
      },
      {
        hash: "0xcdef1234567890abcdef1234567890abcdef1234",
        type: "SBT_MINT",
        amount: 0,
        token: "Reputation SBT",
        from: address,
        to: "0x0000000000000000000000000000000000000000",
        timestamp: new Date("2024-10-27").toISOString(),
        status: "confirmed",
        gasUsed: 0.0008,
        description: "Reputation Soul Bound Token minted",
      },
    ],
  };
}

export async function fetchNFTPortfolio(address: string) {
  // Mock data - in real implementation this would call NFT APIs
  console.log("Fetching NFT portfolio for address:", address);
  return {
    nfts: [
      {
        id: "invoice-nft-001",
        name: "Invoice NFT #001",
        description: "Invoice for Website Development Project",
        image: "/api/placeholder/300/300",
        contractAddress: "0x1234567890abcdef1234567890abcdef12345678",
        tokenId: "1",
        collection: "Workverse Invoices",
        attributes: [
          { trait_type: "Project Type", value: "Web Development" },
          { trait_type: "Amount", value: "$2,500" },
          { trait_type: "Status", value: "Paid" },
          { trait_type: "Date", value: "2024-10-30" },
        ],
        rarity: "Common",
      },
      {
        id: "reputation-sbt-001",
        name: "Reputation SBT",
        description: "Soul Bound Token representing reputation score",
        image: "/api/placeholder/300/300",
        contractAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
        tokenId: "1",
        collection: "Workverse Reputation",
        attributes: [
          { trait_type: "Reputation Score", value: "95" },
          { trait_type: "Projects Completed", value: "23" },
          { trait_type: "Rating", value: "4.8/5" },
          { trait_type: "Level", value: "Expert" },
        ],
        rarity: "Soul Bound",
        transferable: false,
      },
      {
        id: "achievement-nft-001",
        name: "Top Freelancer 2024",
        description: "Achievement NFT for being a top performer",
        image: "/api/placeholder/300/300",
        contractAddress: "0x567890abcdef1234567890abcdef1234567890ab",
        tokenId: "42",
        collection: "Workverse Achievements",
        attributes: [
          { trait_type: "Achievement", value: "Top Freelancer" },
          { trait_type: "Year", value: "2024" },
          { trait_type: "Rank", value: "Top 1%" },
          { trait_type: "Category", value: "Web Development" },
        ],
        rarity: "Legendary",
      },
    ],
  };
}

export default api;
