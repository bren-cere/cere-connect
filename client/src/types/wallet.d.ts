import { EmbedWallet } from "@cere/embed-wallet";

declare global {
  interface Window {
    wallet?: EmbedWallet;
  }
}

// Extend WalletOptions interface to include network property
declare module "@cere/embed-wallet" {
  interface WalletOptions {
    network?: 'testnet' | 'mainnet';
    appName?: string;
  }
}