// Lightweight Aptos wallet helper with defensive provider checks
// Supports common providers exposing `window.aptos`, `window.martian`, or `window.petra`.

type AptosProvider = any;

function getProvider(): AptosProvider | null {
  const w: any = typeof window !== 'undefined' ? window : globalThis as any;
  return w?.aptos ?? w?.martian ?? w?.petra ?? null;
}

// Development mode wallet simulation
function createDevWallet(): AptosProvider {
  console.log('🔧 Creating development wallet simulation');
  return {
    connect: async () => ({ address: '0xdev1234567890abcdef1234567890abcdef12345678' }),
    account: async () => ({ 
      address: '0xdev1234567890abcdef1234567890abcdef12345678',
      publicKey: '0xdev_public_key_placeholder'
    }),
    signMessage: async ({ message }: { message: string }) => ({ 
      signature: `dev_signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }),
    isConnected: () => true,
    isDev: true,
    name: 'Development Wallet'
  };
}

export async function connectAptosWallet(): Promise<{ address: string; publicKey?: string; provider: AptosProvider }>
{
  let provider = getProvider();
  
  // Add comprehensive logging for debugging
  console.log('🔍 Wallet Detection Debug Info:', {
    hasProvider: !!provider,
    providerName: provider?.name || 'None',
    windowExists: typeof window !== 'undefined',
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
    nodeEnv: process.env.NODE_ENV,
    availableProviders: {
      aptos: !!(typeof window !== 'undefined' && (window as any)?.aptos),
      martian: !!(typeof window !== 'undefined' && (window as any)?.martian),
      petra: !!(typeof window !== 'undefined' && (window as any)?.petra),
    }
  });
  
  // If no provider found, check if we should use development mode
  if (!provider) {
    // Check multiple conditions for development mode
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isDev = process.env.NODE_ENV === 'development';
    const allowDevMode = isLocalhost || isDev;
    
    console.log('🔧 Development Mode Check:', {
      isLocalhost,
      isDev,
      allowDevMode,
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      nodeEnv: process.env.NODE_ENV
    });
    
    if (allowDevMode) {
      console.warn('⚠️ No Aptos wallet found. Using development mode wallet simulation.');
      console.log('💡 To use a real wallet, install Petra Wallet or Martian Wallet from your browser extension store.');
      provider = createDevWallet();
    } else {
      throw new Error('No Aptos wallet provider found. Please install Petra Wallet, Martian Wallet, or another Aptos wallet from your browser extension store.');
    }
  } else {
    console.log('✅ Found Aptos wallet provider:', provider.name || 'Unknown wallet');
  }

  // many wallets require a connect() call
  if (typeof provider.connect === 'function') {
    try {
      await provider.connect();
    } catch (e) {
      // some providers will throw if already connected; ignore
    }
  }

  // try to obtain account information
  let accountInfo: any = null;
  if (typeof provider.account === 'function') {
    try {
      accountInfo = await provider.account();
    } catch (_) {
      // ignore
    }
  }

  // some providers expose getAddress or returns account on connect
  const address = accountInfo?.address ?? provider?.address ?? accountInfo?.account ?? null;
  const publicKey = accountInfo?.publicKey ?? provider?.publicKey ?? null;

  if (!address) {
    // last resort: some wallets expose a `account()` promise under `window.aptos.account()` or `window.aptos.getAccount()`
    if (typeof provider.getAccount === 'function') {
      try {
        const acct = await provider.getAccount();
        if (acct?.address) return { address: acct.address, publicKey: acct?.publicKey, provider };
      } catch (_) {}
    }
    throw new Error('Could not determine wallet address from provider');
  }

  return { address, publicKey, provider };
}

export async function signMessageWithWallet(provider: AptosProvider, message: string): Promise<{ signature: string; publicKey?: string }>
{
  // prefer signMessage APIs
  if (!provider) throw new Error('Provider required');

  // Handle development mode wallet
  if (provider.isDev) {
    return { 
      signature: `dev_signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      publicKey: '0xdev_public_key_placeholder'
    };
  }

  // Some wallets: provider.signMessage({ message }) -> returns { signature }
  if (typeof provider.signMessage === 'function') {
    const res = await provider.signMessage({ message });
    // normalize signature to base64 or hex (backend accepts base64 or hex)
    return { signature: res?.signature ?? res?.sig ?? res };
  }

  // Some wallets expose signMessageRaw or signRaw
  if (typeof provider.signMessageRaw === 'function') {
    const res = await provider.signMessageRaw(message);
    return { signature: res?.signature ?? res };
  }

  if (typeof provider.sign === 'function') {
    const res = await provider.sign(message);
    return { signature: res?.signature ?? res };
  }

  // If no signing API, throw so UI can prompt user
  throw new Error('Wallet does not provide a message signing API');
}

const AptosWallet = {
  getProvider,
  connectAptosWallet,
  signMessageWithWallet,
};

export default AptosWallet;
