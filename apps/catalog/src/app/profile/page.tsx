import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Verdant profile and account details.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
