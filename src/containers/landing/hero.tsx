"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Rocket,
  TrendingUp,
  ShieldAlert,
  Zap,
  DollarSign,
  Brain,
  Ghost,
  Sparkles,
  AlertTriangle,
  PartyPopper,
  Bomb,
  CloudLightning,
  Dice5,
  Flame,
  Gift,
  HeartCrack,
  HelpCircle,
  Laugh,
  Moon,
  PawPrintIcon as Poo,
  Skull,
  Snail,
  SprayCan,
  Squirrel,
  ToyBrick,
  Trash2,
  Turtle,
  Wallet,
  Wand2,
  Waves,
  Wind,
  Cat,
  Dog,
  Bird,
  Fish,
  Bug,
  Pizza,
  Gem,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LosersLeaderboard } from "@/components/LosersLeaderboard";
import { usePumpTransactions } from "@/hooks/usePumpTransactions";
import { useState } from "react";
import { AddressSearch } from "@/components/AddressSearch";
import { MemeProgressBar } from "@/components/MemeProgressBar";
import { UserRankCard } from "@/components/UserRankCard";

export default function ObnoxiousLandingPage() {
  const [searchAddress, setSearchAddress] = useState<string>("");

  const {
    transactions,
    isLoading,
    error,
    totalLosses,
    biggestLoss,
    currentBatch,
    totalBatches,
    rankData,
  } = usePumpTransactions(searchAddress);

  const formatSOL = (amount: number) => {
    return `${amount.toFixed(2)} SOL`;
  };

  return (
    <div className="bg-gray-950 text-gray-100 min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-center overflow-hidden p-4">
        <div className="relative z-10">
          <div className="pt-32 pb-16 px-4">
            <div className="container mx-auto">
              <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-yellow-400 to-green-400 animate-pulse">
                  Track any wallet&apos;s pump.fun losses
                </h1>
                <p className="text-xl max-w-2xl mx-auto bg-clip-text text-transparent bg-gradient-to-bl from-blue-400 via-pink-500 to-purple-600">
                  Enter any Solana address to see their pump.fun losses! 🎰
                </p>
              </div>

              <AddressSearch onAddressSubmit={setSearchAddress} />

              {isLoading ? (
                <div className="mb-8">
                  <MemeProgressBar
                    currentBatch={currentBatch || 0}
                    totalBatches={totalBatches || 0}
                  />
                </div>
              ) : (
                searchAddress && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        Total Losses
                      </h3>
                      <p className="text-3xl font-bold text-white">
                        {formatSOL(totalLosses)}
                      </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        Total Transactions
                      </h3>
                      <p className="text-3xl font-bold text-white">
                        {transactions.length}
                      </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">
                        Biggest Loss
                      </h3>
                      <p className="text-3xl font-bold text-white">
                        {formatSOL(biggestLoss)}
                      </p>
                    </div>

                    <UserRankCard
                      rank={rankData?.rank ?? null}
                      totalParticipants={rankData?.totalParticipants ?? 0}
                    />
                  </div>
                )
              )}

              {!isLoading && searchAddress && transactions.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Recent Transactions
                  </h2>
                  <div className="overflow-x-auto bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-white/10">
                          <th className="p-4 text-gray-300">Time</th>
                          <th className="p-4 text-gray-300">Type</th>
                          <th className="p-4 text-gray-300">Amount</th>
                          <th className="p-4 text-gray-300">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr
                            key={tx.signature}
                            className="border-b border-white/5"
                          >
                            <td className="p-4 text-white">
                              {new Date(tx.timestamp * 1000).toLocaleString()}
                            </td>
                            <td className="p-4 text-white capitalize">
                              {tx.type}
                            </td>
                            <td className="p-4 text-white">
                              {formatSOL(tx.amount)}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded-full text-sm ${
                                  tx.success
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {tx.success ? "Success" : "Failed"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-8 p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-red-500/20">
                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-xl font-semibold text-red-400 mb-2">
                      Error
                    </h3>
                    <p className="text-gray-300">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
