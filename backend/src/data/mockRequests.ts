export type MockStoredRequest = {
  id: string;
  clientUserId: string;
  category: string;
  description: string;
  area: string;
  landmark: string;
  maintenanceLevel: "New" | "Medium" | "Old";
  hasPhotos: boolean;
  status: "SEARCHING" | "IN_PROGRESS" | "PENDING" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
};

export const mockRequestStore: MockStoredRequest[] = [];
