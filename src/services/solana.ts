import { Connection, PublicKey, ConnectionConfig, Message, MessageV0, CompiledInstruction, MessageCompiledInstruction, TransactionResponse } from '@solana/web3.js';


// pump.fun program IDs (primary and AMM programs)
const PUMP_PROGRAM_ID = process.env.NEXT_PUBLIC_PUMP_PROGRAM_ID || '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const PUMP_PROGRAM_IDS = [
  PUMP_PROGRAM_ID,
  '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P', // Main pump.fun program
  'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA', // Pump.fun AMM program
  'BSfD6SHZigAfDWSjzD5Q41jw8LmKwtmjskPH9XW1mrRW', // photton pump.fun program
  // Add more pump.fun program IDs as discovered
];

// Thay đổi endpoint RPC
const HELIUS_RPC_ENDPOINT = process.env.NEXT_PUBLIC_HELIUS_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

// Configuration constants
const MAX_TRANSACTIONS = parseInt(process.env.NEXT_PUBLIC_MAX_TRANSACTIONS || '1000') || 1000; // Increased to get more transactions

// Connection configuration
const connectionConfig: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000,
  disableRetryOnRateLimit: false,
  wsEndpoint: undefined,
  httpHeaders: {
    'Content-Type': 'application/json',
  },
};

// Rate limiter configuration - adjusted for Helius limits
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRate: number) {
    this.tokens = capacity;
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  async getToken(): Promise<void> {
    this.refill();
    if (this.tokens <= 0) {
      const waitTime = Math.ceil((1 / this.refillRate) * 1000);
      await delay(waitTime);
      this.refill();
    }
    this.tokens--;
  }

  private refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

// Create rate limiter instance - Increased for better performance
const rateLimiter = new TokenBucket(10, 2); // 10 tokens, 2 requests/second

export interface PumpTransaction {
  signature: string;
  timestamp: number;
  amount: number;
  type: 'deposit' | 'withdraw' | 'bet';
  success: boolean;
}

// Utility function for network retries
const fetchWithRetry = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  retries: number = 3,
  backoff: number = 1000
): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(input, init);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`Fetch attempt ${i + 1} failed:`, lastError.message);
      
      if (i < retries - 1) {
        const delay = backoff * Math.pow(2, i) + Math.random() * 1000;
        console.log(`Retrying in ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after multiple retries');
};

const createConnection = () => {
  return new Connection(HELIUS_RPC_ENDPOINT, connectionConfig);
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await promise;
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Helper function to check if an instruction uses pump.fun program
const isPumpInstruction = (instruction: CompiledInstruction | MessageCompiledInstruction, accounts: PublicKey[]): boolean => {
  const programId = accounts[instruction.programIdIndex];
  return programId && PUMP_PROGRAM_IDS.includes(programId.toBase58());
};

// Add a sleep utility function if not already present
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface ProgressData {
  processedTransactions: number;
  pumpTransactions: number;
  totalProfit: number;
  totalLoss: number;
  netResult: number;
  currentBatchProgress: string;
}

// Fetch latest transactions and detect pump.fun ones
export const fetchLatestPumpTransactions = async (
  connection: Connection,
  walletAddress: string,
  onProgress?: (current: number, total: number, progressData?: ProgressData) => void
): Promise<PumpTransaction[]> => {
  try {
    // Log the RPC endpoint being used
    console.log('Using RPC endpoint:', HELIUS_RPC_ENDPOINT);
    console.log('Using PUMP_PROGRAM_IDS:', PUMP_PROGRAM_IDS);
    console.log('MAX_TRANSACTIONS:', MAX_TRANSACTIONS);

    const conn = createConnection();
    const pubKey = new PublicKey(walletAddress);

    // Build options for getSignaturesForAddress - ALWAYS fetch latest MAX_TRANSACTIONS
    const options: any = {
      limit: MAX_TRANSACTIONS,
      commitment: 'confirmed'
    };

    console.log(`Fetching latest ${MAX_TRANSACTIONS} transactions for wallet`);

    const allSignatures = await conn.getSignaturesForAddress(pubKey, options);
    console.log(`Found ${allSignatures.length} total signatures for address: ${walletAddress}`);

    if (allSignatures.length === 0) {
      console.log('No signatures found for this address');
      return [];
    }

    const batchSize = 5; // Increased batch size for better performance
    const totalBatches = Math.ceil(allSignatures.length / batchSize);
    
    // Initial progress update
    onProgress?.(1, totalBatches);

    const transactions: PumpTransaction[] = [];
    let processedCount = 0;
    let pumpCount = 0;
    let runningProfit = 0;
    let runningLoss = 0;

    for (let i = 0; i < allSignatures.length; i += batchSize) {
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      // 🆕 Calculate current stats
      const currentNetResult = runningProfit - runningLoss;
      const progressData: ProgressData = {
        processedTransactions: processedCount,
        pumpTransactions: pumpCount,
        totalProfit: runningProfit,
        totalLoss: runningLoss,
        netResult: currentNetResult,
        currentBatchProgress: `Processing batch ${currentBatch}/${totalBatches}...`
      };
      
      // Update progress with detailed data
      onProgress?.(currentBatch, totalBatches, progressData);
      console.log(`Processing batch ${currentBatch}/${totalBatches} - Pump: ${pumpCount}, Profit: ${runningProfit.toFixed(4)} SOL, Loss: ${runningLoss.toFixed(4)} SOL`);

      // Add small delay between batches to prevent overwhelming the RPC
      await sleep(300);

      const batch = allSignatures.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (sig) => {
          try {
            // Rate limit requests
            await rateLimiter.getToken();
            
            const tx = await conn.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed',
            });

            if (!tx) {
              console.log(`Transaction ${sig.signature} not found`);
              return;
            }

            console.log(`Processing transaction ${sig.signature}:`, {
              blockTime: tx.blockTime,
              fee: tx.meta?.fee,
              success: tx.meta?.err === null,
              messageType: 'version' in tx.transaction.message ? 'MessageV0' : 'Legacy'
            });

            // Get all accounts involved in the transaction (with ALT handling)
            let accounts: PublicKey[];
            try {
              if ('version' in tx.transaction.message) {
                // MessageV0 format - handle Address Lookup Tables
                const messageV0 = tx.transaction.message as MessageV0;
                accounts = [...messageV0.staticAccountKeys];
                
                // Safely handle loaded addresses from Address Lookup Tables
                if (tx.meta?.loadedAddresses) {
                  if (tx.meta.loadedAddresses.writable && tx.meta.loadedAddresses.writable.length > 0) {
                    accounts = accounts.concat(tx.meta.loadedAddresses.writable);
                  }
                  if (tx.meta.loadedAddresses.readonly && tx.meta.loadedAddresses.readonly.length > 0) {
                    accounts = accounts.concat(tx.meta.loadedAddresses.readonly);
                  }
                  console.log(`Transaction ${sig.signature} - Loaded ${tx.meta.loadedAddresses.writable?.length || 0} writable and ${tx.meta.loadedAddresses.readonly?.length || 0} readonly addresses from ALTs`);
                } else {
                  console.warn(`Transaction ${sig.signature} - MessageV0 but no loaded addresses. This might cause issues with account resolution.`);
                }
              } else {
                // Legacy Message format
                const legacyMessage = tx.transaction.message as Message;
                accounts = legacyMessage.accountKeys;
              }
              
              console.log(`Transaction ${sig.signature} - Total accounts resolved: ${accounts.length}`);
              
            } catch (accountError) {
              console.error(`Error resolving accounts for transaction ${sig.signature}:`, accountError);
              console.log(`Skipping transaction due to account resolution failure`);
              return;
            }

            // Check if any instruction uses the pump.fun program
            let isPumpTransaction = false;
            const message = tx.transaction.message;
            
            try {
              if ('version' in message) {
                // MessageV0 format - enhanced ALT handling
                const messageV0 = message as MessageV0;
                const compiledInstructions = messageV0.compiledInstructions;
                
                console.log(`Checking MessageV0 transaction ${sig.signature} with ${compiledInstructions.length} instructions and ${accounts.length} total accounts`);
                
                isPumpTransaction = compiledInstructions.some((ix, index) => {
                  try {
                    if (ix.programIdIndex >= accounts.length) {
                      console.warn(`Instruction ${index}: programIdIndex ${ix.programIdIndex} >= accounts.length ${accounts.length} for transaction ${sig.signature}`);
                      return false;
                    }
                    
                    const programId = accounts[ix.programIdIndex];
                    if (!programId) {
                      console.warn(`Instruction ${index}: No program ID found at index ${ix.programIdIndex} for transaction ${sig.signature}`);
                      return false;
                    }
                    
                    const programIdStr = programId.toBase58();
                    const isPump = PUMP_PROGRAM_IDS.includes(programIdStr);
                    
                    console.log(`Instruction ${index}: Program ${programIdStr} ${isPump ? '✅ PUMP.FUN' : '❌ Other'}`);
                    
                    if (isPump) {
                      console.log(`✅ Found pump.fun instruction in transaction ${sig.signature} (V0) - Program: ${programIdStr}`);
                    }
                    return isPump;
                  } catch (ixError) {
                    console.warn(`Error checking instruction ${index} in V0 transaction ${sig.signature}:`, ixError);
                    return false;
                  }
                });
              } else {
                // Legacy Message format
                const legacyMessage = message as Message;
                const instructions = legacyMessage.instructions;
                
                console.log(`Checking Legacy transaction ${sig.signature} with ${instructions.length} instructions and ${accounts.length} total accounts`);
                
                isPumpTransaction = instructions.some((ix, index) => {
                  try {
                    if (ix.programIdIndex >= accounts.length) {
                      console.warn(`Legacy instruction ${index}: programIdIndex ${ix.programIdIndex} >= accounts.length ${accounts.length} for transaction ${sig.signature}`);
                      return false;
                    }
                    
                    const programId = accounts[ix.programIdIndex];
                    if (!programId) {
                      console.warn(`Legacy instruction ${index}: No program ID found at index ${ix.programIdIndex} for transaction ${sig.signature}`);
                      return false;
                    }
                    
                    const programIdStr = programId.toBase58();
                    const isPump = PUMP_PROGRAM_IDS.includes(programIdStr);
                    
                    console.log(`Legacy instruction ${index}: Program ${programIdStr} ${isPump ? '✅ PUMP.FUN' : '❌ Other'}`);
                    
                    if (isPump) {
                      console.log(`✅ Found pump.fun instruction in transaction ${sig.signature} (Legacy) - Program: ${programIdStr}`);
                    }
                    return isPump;
                  } catch (ixError) {
                    console.warn(`Error checking legacy instruction ${index} in transaction ${sig.signature}:`, ixError);
                    return false;
                  }
                });
              }
            } catch (messageError) {
              console.error(`Error parsing transaction message for ${sig.signature}:`, messageError);
              console.log(`Skipping transaction due to message parsing failure`);
              return;
            }

            // Find the user's account index first to calculate balance change
            const userAccountIndex = accounts.findIndex(account => 
              account.toBase58() === pubKey.toBase58()
            );

            if (userAccountIndex === -1) {
              console.log(`User account not found in transaction ${sig.signature}`);
              return;
            }

            // Check if we have metadata for balance changes
            if (!tx.meta) {
              console.log(`No metadata found for transaction ${sig.signature}`);
              return;
            }

            // Calculate SOL balance changes
            const preBalance = tx.meta.preBalances[userAccountIndex] || 0;
            const postBalance = tx.meta.postBalances[userAccountIndex] || 0;
            
            if (preBalance === undefined || postBalance === undefined) {
              console.log(`Invalid balance data for transaction ${sig.signature}`);
              return;
            }
            
            const solBalanceChange = (preBalance - postBalance) / 1e9; // Convert from lamports to SOL

            // Simple pump.fun detection: Program ID match OR significant SOL movement
            console.log(`Checking transaction ${sig.signature}:`, {
              isPumpByProgramId: isPumpTransaction,
              solBalanceChange,
              isSuccessful: tx.meta?.err === null
            });

            // If not a pump.fun program transaction, skip (no fallback for now)
            if (!isPumpTransaction) {
              console.log(`Transaction ${sig.signature} - Not a pump.fun program transaction`);
              return;
            }
            
            // Only process successful pump.fun transactions with SOL movement
            const isSuccessful = tx.meta?.err === null;
            if (!isSuccessful) {
              console.log(`Transaction ${sig.signature} - Failed transaction, skipping`);
              return;
            }
            
            console.log(`Transaction ${sig.signature} balance analysis:`, {
              preBalance: preBalance / 1e9,
              postBalance: postBalance / 1e9,
              change: solBalanceChange,
              userAccountIndex,
              totalAccounts: accounts.length
            });
            
            // Calculate profit/loss based on SOL balance change
            // Positive solBalanceChange = SOL spent = Loss
            // Negative solBalanceChange = SOL gained = Profit
            
            console.log(`Pump.fun transaction analysis:`, {
              signature: sig.signature,
              preBalance: preBalance / 1e9,
              postBalance: postBalance / 1e9,
              solBalanceChange,
              interpretation: solBalanceChange > 0 ? 'LOSS (SOL spent)' : solBalanceChange < 0 ? 'PROFIT (SOL gained)' : 'NO CHANGE'
            });
            
            // Record ANY SOL movement in pump.fun transactions (even small amounts)
            if (Math.abs(solBalanceChange) > 0.0001) { // Very small threshold
              // Determine transaction type
              let transactionType: 'deposit' | 'withdraw' | 'bet' = 'bet';
              
              if (solBalanceChange > 0) {
                transactionType = 'bet'; // User spent SOL (loss)
              } else if (solBalanceChange < 0) {
                transactionType = 'withdraw'; // User received SOL (profit)
              }
              
              transactions.push({
                signature: sig.signature,
                timestamp: tx.blockTime || Math.floor(Date.now() / 1000),
                amount: Math.abs(solBalanceChange),
                type: transactionType,
                success: true, // We already checked it's successful
              });
              
              console.log(`✅ Recorded pump.fun transaction:`, {
                signature: sig.signature,
                amount: Math.abs(solBalanceChange),
                type: transactionType,
                result: solBalanceChange > 0 ? 'LOSS' : 'PROFIT'
              });

              // 🆕 Update counters when pump transaction is found
              if (Math.abs(solBalanceChange) > 0.0001) {
                pumpCount++;
                
                if (solBalanceChange > 0) {
                  runningLoss += Math.abs(solBalanceChange);
                } else if (solBalanceChange < 0) {
                  runningProfit += Math.abs(solBalanceChange);
                }
              }
            } else {
              console.log(`❌ Skipping pump.fun transaction with minimal SOL change:`, {
                signature: sig.signature,
                solBalanceChange
              });
            }

          } catch (error) {
            console.error('Error processing transaction:', sig.signature, error);
            
            if (error instanceof Error && error.message?.includes('429')) {
              console.log('Rate limit hit, sleeping before next batch...');
              await sleep(5000); // Wait longer for rate limits
            }
          }
        })
      );
    }

    console.log(`Successfully processed ${transactions.length} pump.fun transactions`);
    return transactions.sort((a, b) => b.timestamp - a.timestamp);

  } catch (error) {
    if (error instanceof Error && error.message?.includes('429')) {
      throw new Error('Rate limit exceeded. Please try again in a few minutes.');
    }
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const calculateTotalLosses = (transactions: PumpTransaction[]): number => {
  const totalLosses = transactions.reduce((total, tx) => {
    // Only count 'bet' transactions as losses (SOL spent on pump.fun)
    if (tx.type === 'bet' && tx.success && tx.amount > 0) {
      console.log(`📉 Loss: ${tx.amount} SOL from transaction ${tx.signature}`);
      return total + tx.amount;
    }
    return total;
  }, 0);
  
  console.log(`💸 Total losses: ${totalLosses} SOL from ${transactions.length} transactions`);
  return totalLosses;
};

export const calculateTotalProfits = (transactions: PumpTransaction[]): number => {
  const totalProfits = transactions.reduce((total, tx) => {
    // Count 'withdraw' transactions as profits (SOL gained from pump.fun)
    if (tx.type === 'withdraw' && tx.success && tx.amount > 0) {
      console.log(`📈 Profit: ${tx.amount} SOL from transaction ${tx.signature}`);
      return total + tx.amount;
    }
    return total;
  }, 0);
  
  console.log(`💰 Total profits: ${totalProfits} SOL from ${transactions.length} transactions`);
  return totalProfits;
};

export const calculateNetResult = (transactions: PumpTransaction[]): number => {
  const profits = calculateTotalProfits(transactions);
  const losses = calculateTotalLosses(transactions);
  const net = profits - losses;
  
  console.log(`🧮 Net result: ${net} SOL (${profits} profit - ${losses} loss)`);
  return net;
};

// Update the function signature to accept progressData parameter
export async function fetchPumpTransactions(
  connection: Connection,
  walletAddress: string,
  onProgress?: (current: number, total: number, progressData?: ProgressData) => void
): Promise<PumpTransaction[]> {
  return fetchLatestPumpTransactions(connection, walletAddress, onProgress);
} 