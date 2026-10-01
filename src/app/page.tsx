import React from "react";
import { fetchSessions } from "@/lib/db";
import { HomeClient } from "@/components/home/HomeClient";

export const revalidate = 60;

export default async function HomePage() {
  const sessions = await fetchSessions(true);

  return <HomeClient initialSessions={sessions} />;
}
