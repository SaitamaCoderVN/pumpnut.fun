import { Connection, PublicKey, ConnectionConfig, Message, MessageV0, CompiledInstruction, MessageCompiledInstruction, TransactionResponse } from '@solana/web3.js';


// pump.fun program ID (correct mainnet program ID)
const PUMP_PROGRAM_ID = process.env.NEXT_PUBLIC_PUMP_PROGRAM_ID || '';

// Thay đổi endpoint RPC
const HELIUS_RPC_ENDPOINT = process.env.NEXT_PUBLIC_HELIUS_RPC_ENDPOINT || '';

// Configuration constants
const MAX_TRANSACTIONS = parseInt(process.env.NEXT_PUBLIC_MAX_TRANSACTIONS || '');

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

// Create rate limiter instance (5 requests per second)
const rateLimiter = new TokenBucket(2, 0.3); // Giảm xuống 2 tokens, 0.3 requests/second

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
  return programId && programId.toBase58() === PUMP_PROGRAM_ID;
};

// Add a sleep utility function if not already present
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Update the fetchPumpTransactions function to handle rate limits better
export const fetchPumpTransactions = async (
  connection: Connection,
  walletAddress: string,
  onProgress?: (current: number, total: number) => void
): Promise<PumpTransaction[]> => {
  try {
    // Log the RPC endpoint being used
    console.log('Using RPC endpoint:', HELIUS_RPC_ENDPOINT);

    const conn = createConnection();
    const pubKey = new PublicKey(walletAddress);

    const allSignatures = await conn.getSignaturesForAddress(
      pubKey,
      { limit: MAX_TRANSACTIONS }, // Increase limit to get more transactions
      'confirmed'
    );

    if (allSignatures.length === 0) {
      return [];
    }

    const batchSize = 3;
    const totalBatches = Math.ceil(allSignatures.length / batchSize);
    
    // Initial progress update
    onProgress?.(1, totalBatches);

    const transactions: PumpTransaction[] = [];

    for (let i = 0; i < allSignatures.length; i += batchSize) {
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      // Update progress before processing batch
      onProgress?.(currentBatch, totalBatches);
      console.log(`Processing batch ${currentBatch}/${totalBatches}`);

      // Add delay for visual effect
      await sleep(1000);

      const batch = allSignatures.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (sig) => {
          try {
            // Add delay before each transaction fetch
            await sleep(500); // 500ms delay between transactions within a batch
            
            const tx = await conn.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed',
            });

            if (!tx) {
              console.log(`Transaction ${sig.signature} not found`);
              return;
            }

            // Get all accounts involved in the transaction
            let accounts: PublicKey[];
            if ('version' in tx.transaction.message) {
              accounts = [...(tx.transaction.message as MessageV0).staticAccountKeys];
              if (tx.meta?.loadedAddresses) {
                accounts = accounts.concat(
                  tx.meta.loadedAddresses.writable,
                  tx.meta.loadedAddresses.readonly
                );
              }
            } else {
              const legacyMessage = tx.transaction.message as Message;
              accounts = legacyMessage.accountKeys;
            }

            // Check if any instruction uses the pump.fun program
            let isPumpTransaction = false;
            const message = tx.transaction.message;
            
            if ('version' in message) {
              // MessageV0 format
              const compiledInstructions = (message as MessageV0).compiledInstructions;
              isPumpTransaction = compiledInstructions.some(ix => {
                const programId = accounts[ix.programIdIndex];
                return programId && programId.toBase58() === PUMP_PROGRAM_ID;
              });
            } else {
              // Legacy Message format
              const instructions = (message as Message).instructions;
              isPumpTransaction = instructions.some(ix => {
                const programId = accounts[ix.programIdIndex];
                return programId && programId.toBase58() === PUMP_PROGRAM_ID;
              });
            }

            if (!isPumpTransaction) {
              return;
            }

            // Find the user's account index
            const userAccountIndex = accounts.findIndex(account => 
              account.toBase58() === pubKey.toBase58()
            );

            if (userAccountIndex === -1) {
              return;
            }

            // Calculate SOL balance changes
            const preBalance = tx.meta?.preBalances[userAccountIndex] || 0;
            const postBalance = tx.meta?.postBalances[userAccountIndex] || 0;
            const solBalanceChange = (preBalance - postBalance) / 1e9; // Convert from lamports to SOL
            
            // For pump.fun, we're mainly interested in SOL spent (losses)
            // A positive solBalanceChange means SOL was spent (user lost SOL)
            if (solBalanceChange > 0.001) { // Only count significant SOL losses (>0.001 SOL)
              // Check if this was a successful transaction
              const success = tx.meta?.err === null;
              
              // Determine transaction type based on instruction data if possible
              let transactionType: 'deposit' | 'withdraw' | 'bet' = 'bet';
              
              // For pump.fun, most SOL spending transactions are "bets" (buying tokens)
              if (solBalanceChange > 0) {
                transactionType = 'bet'; // User spent SOL to buy tokens
              }
              
              transactions.push({
                signature: sig.signature,
                timestamp: tx.blockTime || Math.floor(Date.now() / 1000),
                amount: solBalanceChange, // This is the SOL amount lost
                type: transactionType,
                success: success,
              });
              
              console.log(`Found pump.fun transaction:`, {
                signature: sig.signature,
                solSpent: solBalanceChange,
                type: transactionType,
                success: success,
                preBalance: preBalance / 1e9,
                postBalance: postBalance / 1e9,
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
    // Only count successful bets as losses (SOL spent on pump.fun)
    if (tx.type === 'bet' && tx.success && tx.amount > 0) {
      console.log(`Adding loss from transaction ${tx.signature}: ${tx.amount} SOL`);
      return total + tx.amount;
    }
    return total;
  }, 0);
  
  console.log(`Total losses calculated: ${totalLosses} SOL from ${transactions.length} transactions`);
  return totalLosses;
}; 