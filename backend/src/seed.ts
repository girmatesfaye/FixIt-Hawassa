import "dotenv/config";
import { randomBytes, scryptSync } from "crypto";
import mongoose from "mongoose";
import { env, isPlaceholderMongoUri } from "./config/env";
import { User, WorkerProfile } from "./models";

type WorkerSeed = {
  user: {
    fullName: string;
    phone: string;
    password: string;
    role: "worker";
    area: string;
    nationalId: string;
    isVerified: boolean;
    status: "active" | "suspended";
  };
  profile: {
    title: string;
    bio: string;
    area: string;
    skills: string[];
    telegramUsername: string;
    tiktokProfile: string;
    rating: number;
    reviews: number;
    isActive: boolean;
    completionRate: number;
    responseMinutes: number;
    avatar: string;
    portfolio: string[];
  };
};

const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
};

const WORKERS: WorkerSeed[] = [
  {
    user: {
      fullName: "Abebe Kebede",
      phone: "+251911111101",
      password: "worker123",
      role: "worker",
      area: "Tabor",
      nationalId: "ETH-WORKER-1001",
      isVerified: true,
      status: "active",
    },
    profile: {
      title: "Master Plumber",
      bio: "Experienced plumber handling pipe repair, leakage fixes, water heater setup, and emergency home visits in Hawassa.",
      area: "Tabor",
      skills: ["Plumbing", "Pipe Repair", "Leak Fix", "Water Heater"],
      telegramUsername: "abebe_plumb",
      tiktokProfile: "https://www.tiktok.com/@abebe_plumb",
      rating: 4.9,
      reviews: 124,
      isActive: true,
      completionRate: 0.96,
      responseMinutes: 8,
      avatar: "/uploads/workers/abebe.jpg",
      portfolio: [
        "/uploads/workers/abebe-job-1.jpg",
        "/uploads/workers/abebe-job-2.jpg",
      ],
    },
  },
  {
    user: {
      fullName: "Tigist Bekele",
      phone: "+251911111102",
      password: "worker123",
      role: "worker",
      area: "Piassa",
      nationalId: "ETH-WORKER-1002",
      isVerified: true,
      status: "active",
    },
    profile: {
      title: "Electrician",
      bio: "Residential electrician focused on wiring fixes, breaker issues, lighting installation, and safe maintenance work.",
      area: "Piassa",
      skills: ["Electrical", "Lighting", "Wiring", "Socket Repair"],
      telegramUsername: "tigist_electric",
      tiktokProfile: "https://www.tiktok.com/@tigist_electric",
      rating: 4.8,
      reviews: 98,
      isActive: true,
      completionRate: 0.94,
      responseMinutes: 10,
      avatar: "/uploads/workers/tigist.jpg",
      portfolio: [
        "/uploads/workers/tigist-job-1.jpg",
        "/uploads/workers/tigist-job-2.jpg",
      ],
    },
  },
  {
    user: {
      fullName: "Dawit Alemu",
      phone: "+251911111103",
      password: "worker123",
      role: "worker",
      area: "Gudumale",
      nationalId: "ETH-WORKER-1003",
      isVerified: true,
      status: "active",
    },
    profile: {
      title: "Painter and Finisher",
      bio: "Interior and exterior painter with experience in wall finishing, color matching, and repainting damaged rooms.",
      area: "Gudumale",
      skills: ["Painting", "Wall Finishing", "Color Coating", "Decor"],
      telegramUsername: "dawit_paint",
      tiktokProfile: "https://www.tiktok.com/@dawit_paint",
      rating: 4.7,
      reviews: 73,
      isActive: true,
      completionRate: 0.91,
      responseMinutes: 14,
      avatar: "/uploads/workers/dawit.jpg",
      portfolio: [
        "/uploads/workers/dawit-job-1.jpg",
        "/uploads/workers/dawit-job-2.jpg",
      ],
    },
  },
  {
    user: {
      fullName: "Meron Hailu",
      phone: "+251911111104",
      password: "worker123",
      role: "worker",
      area: "Millennium",
      nationalId: "ETH-WORKER-1004",
      isVerified: true,
      status: "active",
    },
    profile: {
      title: "General Home Repair",
      bio: "Multi-skilled worker handling small repairs, fittings, maintenance, and urgent home service requests around Hawassa.",
      area: "Millennium",
      skills: ["General Repair", "Carpentry", "Plumbing", "Maintenance"],
      telegramUsername: "meron_fixit",
      tiktokProfile: "https://www.tiktok.com/@meron_fixit",
      rating: 4.6,
      reviews: 61,
      isActive: true,
      completionRate: 0.89,
      responseMinutes: 12,
      avatar: "/uploads/workers/meron.jpg",
      portfolio: [
        "/uploads/workers/meron-job-1.jpg",
        "/uploads/workers/meron-job-2.jpg",
      ],
    },
  },
];

const seedWorkers = async () => {
  if (!env.mongoUri || isPlaceholderMongoUri(env.mongoUri)) {
    throw new Error(
      "MONGODB_URI is not configured. Set a real MongoDB connection string before seeding.",
    );
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  let createdUsers = 0;
  let updatedUsers = 0;
  let createdProfiles = 0;
  let updatedProfiles = 0;

  for (const worker of WORKERS) {
    const existingUser = await User.findOne({ phone: worker.user.phone })
      .select("_id")
      .lean();

    const user = await User.findOneAndUpdate(
      { phone: worker.user.phone },
      {
        $set: {
          fullName: worker.user.fullName,
          role: worker.user.role,
          area: worker.user.area,
          nationalId: worker.user.nationalId,
          isVerified: worker.user.isVerified,
          status: worker.user.status,
        },
        $setOnInsert: {
          phone: worker.user.phone,
          passwordHash: hashPassword(worker.user.password),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    if (!user) {
      throw new Error(`Failed to upsert user ${worker.user.fullName}`);
    }

    if (existingUser) {
      updatedUsers += 1;
    } else {
      createdUsers += 1;
    }

    const existingProfile = await WorkerProfile.findOne({ userId: user._id })
      .select("_id")
      .lean();

    await WorkerProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          ...worker.profile,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    if (existingProfile) {
      updatedProfiles += 1;
    } else {
      createdProfiles += 1;
    }
  }

  console.log(
    [
      "Worker seed completed.",
      `Users created: ${createdUsers}`,
      `Users updated: ${updatedUsers}`,
      `Profiles created: ${createdProfiles}`,
      `Profiles updated: ${updatedProfiles}`,
    ].join(" "),
  );
};

void seedWorkers()
  .catch((error) => {
    console.error("[seed] Failed to seed workers", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
