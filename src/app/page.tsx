"use client";

import { Header } from "@/components/Header";
import { AddressSearch } from "@/components/AddressSearch";
import { usePumpTransactions } from "@/hooks/usePumpTransactions";
import { useState } from "react";
import { MemeProgressBar } from "@/components/MemeProgressBar";
import { LosersLeaderboard } from "@/components/LosersLeaderboard";
import { UserRankCard } from "@/components/UserRankCard";
import ObnoxiousLandingPage from "@/containers/landing/hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-purple-950">
      <Header />
      <ObnoxiousLandingPage />
    </main>
  );
}
