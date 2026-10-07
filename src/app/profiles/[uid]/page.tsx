import { PublicProfileView } from "@/components/profile/PublicProfileView";

export default async function ProfilePage({ params }: PageProps<"/profiles/[uid]">) {
  const { uid } = await params;
  return <PublicProfileView uid={uid} />;
}
