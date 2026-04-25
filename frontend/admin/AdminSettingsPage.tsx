import React, { useEffect, useState } from "react";
import { getAuthToken } from "../services/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

type AdminProfile = {
  id: string;
  name: string;
  role: string;
  phone: string;
  area: string;
  status: string;
  isVerified: boolean;
};

const AdminSettingsPage: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMe = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = (await response.json().catch(() => null)) as {
          user?: AdminProfile;
        } | null;

        if (!response.ok || !result?.user) {
          throw new Error("LOAD_FAILED");
        }

        setProfile(result.user);
      } catch (error) {
        console.error("Failed to load admin profile", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#120e1b]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Admin account details from the live session.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {profile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-semibold text-[#120e1b]">{profile.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Role</p>
              <p className="font-semibold text-[#120e1b] capitalize">
                {profile.role}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-semibold text-[#120e1b]">{profile.phone}</p>
            </div>
            <div>
              <p className="text-gray-500">Area</p>
              <p className="font-semibold text-[#120e1b]">
                {profile.area || "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Account Status</p>
              <p className="font-semibold text-[#120e1b] capitalize">
                {profile.status}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Verification</p>
              <p className="font-semibold text-[#120e1b]">
                {profile.isVerified ? "Verified" : "Pending"}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">Could not load admin settings.</p>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;
