import { WorkerRecommendation } from "../types";

export const mockWorkers: WorkerRecommendation[] = [
  {
    id: 1,
    name: "Abebe Kebede",
    location: "Hawassa, Piassa",
    area: "Piassa",
    rating: 4.8,
    reviews: 142,
    isActive: true,
    distanceKm: 1.2,
    completionRate: 0.96,
    responseMinutes: 6,
    skills: ["Plumbing", "Pipe Repair", "Leak Fix"],
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&h=300&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Tigist Bekele",
    location: "Hawassa, Tabor",
    area: "Tabor",
    rating: 4.9,
    reviews: 89,
    isActive: true,
    distanceKm: 3.4,
    completionRate: 0.93,
    responseMinutes: 9,
    skills: ["Plumbing", "Installation", "Bathroom Fix"],
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&h=300&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Dawit Alemu",
    location: "Hawassa, Millennium",
    area: "Millennium",
    rating: 4.5,
    reviews: 56,
    isActive: true,
    distanceKm: 5.2,
    completionRate: 0.89,
    responseMinutes: 12,
    skills: ["General Repair", "Plumbing", "Emergency Service"],
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&h=300&auto=format&fit=crop",
  },
  {
    id: 4,
    name: "Meron Hailu",
    location: "Hawassa, Gudumale",
    area: "Gudumale",
    rating: 4.7,
    reviews: 63,
    isActive: false,
    distanceKm: 7.9,
    completionRate: 0.9,
    responseMinutes: 14,
    skills: ["Plumbing", "Water Heater", "Maintenance"],
    avatar:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=300&h=300&auto=format&fit=crop",
  },
];

export const mockUsers = [
  {
    id: "usr-1",
    name: "Abebe Kebede",
    role: "worker",
    status: "active",
    phone: "+251911234567",
  },
  {
    id: "usr-2",
    name: "Sarah Tadesse",
    role: "client",
    status: "active",
    phone: "+251922123123",
  },
  {
    id: "usr-3",
    name: "Dawit Alemu",
    role: "worker",
    status: "suspended",
    phone: "+251933555000",
  },
];
