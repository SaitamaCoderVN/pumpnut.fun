import { Connection, PublicKey, ConnectionConfig, Message, MessageV0, CompiledInstruction, MessageCompiledInstruction, TransactionResponse } from '@solana/web3.js';


// pump.fun program ID (verified)
const PUMP_PROGRAM_ID = process.env.NEXT_PUBLIC_PUMP_PROGRAM_ID || 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';

// Using Helius RPC endpoint
const HELIUS_RPC_ENDPOINT = process.env.NEXT_PUBLIC_HELIUS_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

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
const rateLimiter = new TokenBucket(3, 0.5); // 3 tokens, refill rate of 0.5 per second (more conservative)

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

// Update the helper function
const isPumpInstruction = (instruction: CompiledInstruction | MessageCompiledInstruction, accounts: PublicKey[]): boolean => {
  // Check if the program ID is the pump.fun program
  const programId = accounts[instruction.programIdIndex];
  return programId && programId.toBase58() === PUMP_PROGRAM_ID;
};

// Update the transaction processing logic
const determineTransactionType = (
  preBalance: number,
  postBalance: number,
  accounts: PublicKey[],
  instructions: CompiledInstruction[]
): 'deposit' | 'withdraw' | 'bet' => {
  const balanceChange = (preBalance - postBalance) / 1e9;
  
  // If it's a pump.fun program instruction and there's a balance decrease, it's likely a bet
  const isPumpBet = instructions.some(ix => isPumpInstruction(ix, accounts));
  
  if (isPumpBet && balanceChange > 0) {
    return 'bet';
  }
  
  // Otherwise determine based on balance change
  if (balanceChange < 0) {
    return 'deposit';
  }
  return 'withdraw';
};

// In the transaction processing section, update the check:
const processTransaction = async (tx: TransactionResponse) => {
  // ... existing code ...

  // Get all accounts involved in the transaction
  let accounts: PublicKey[];
  if ('version' in tx.transaction.message) {
    accounts = [...(tx.transaction.message as unknown as MessageV0).staticAccountKeys];
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
  let foundPumpProgram = false;
  const message = tx.transaction.message as Message | MessageV0;
  if ('version' in message) {
    foundPumpProgram = message.compiledInstructions.some(ix => 
      isPumpInstruction(ix, accounts)
    );
  } else {
    foundPumpProgram = (message as Message).instructions.some(ix => 
      isPumpInstruction(ix, accounts)
    );
  }

  if (!foundPumpProgram) {
    console.log(`Transaction ${tx.transaction.signatures[0]} is not a pump.fun transaction`);
    return null;
  }

  // ... rest of the processing code ...
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
    const conn = createConnection();
    const pubKey = new PublicKey(walletAddress);

    const allSignatures = await conn.getSignaturesForAddress(
      pubKey,
      { limit: 100 },
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

            // Check for pump.fun program ID in any of the accounts
            const isPumpTransaction = accounts.some(account => 
              account.toBase58() === PUMP_PROGRAM_ID
            );

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

            // Calculate balance changes
            const preBalance = tx.meta?.preBalances[userAccountIndex] || 0;
            const postBalance = tx.meta?.postBalances[userAccountIndex] || 0;
            const balanceChange = Math.abs((preBalance - postBalance) / 1e9);

            // If there's a significant balance change, record the transaction
            if (balanceChange > 0.000001) { // Filter out dust transactions
              transactions.push({
                signature: sig.signature,
                timestamp: tx.blockTime || Math.floor(Date.now() / 1000),
                amount: balanceChange,
                type: preBalance > postBalance ? 'bet' : 'withdraw',
                success: tx.meta?.err === null,
              });
              
              console.log(`Found pump.fun transaction:`, {
                signature: sig.signature,
                amount: balanceChange,
                type: preBalance > postBalance ? 'bet' : 'withdraw',
              });
            }

          } catch (error) {
            if (error instanceof Error && error.message?.includes('429')) {
              // If we hit a rate limit, wait longer and retry once
              await sleep(3000);
              try {
                const tx = await conn.getTransaction(sig.signature, {
                  maxSupportedTransactionVersion: 0,
                  commitment: 'confirmed',
                });
                // ... process transaction ...
              } catch (retryError) {
                console.error('Error after retry:', sig.signature, retryError);
              }
            } else {
              console.error('Error processing transaction:', sig.signature, error);
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
  return transactions.reduce((total, tx) => {
    // Only count successful bets as losses
    if (tx.type === 'bet' && tx.success) {
      console.log(`Adding loss from transaction: ${tx.amount}`);
      return total + tx.amount;
    }
    return total;
  }, 0);
}; 