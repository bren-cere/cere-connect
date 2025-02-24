import { useToast } from "@/hooks/use-toast";
import { EmbedWallet } from "@cere/embed-wallet";
import { CereWalletSigner } from "@cere-activity-sdk/signers";
import { CereWalletCipher } from "@cere-activity-sdk/ciphers";
import { EventSource } from "@cere-activity-sdk/events";
import { useCallback, useState } from "react";

declare global {
  interface Window {
    wallet?: EmbedWallet;
    walletSigner?: CereWalletSigner;
    walletCipher?: CereWalletCipher;
    eventSource?: EventSource;
  }
}

const initializeWallet = async () => {
  try {
    console.log("Initializing Cere Wallet...");

    if (!window.wallet) {
      window.wallet = new EmbedWallet({
        env: "stage",
        appId: "Cere Wallet Demo",
        connectOptions: {
          permissions: {
            ed25519_signRaw: {
              title: "Signing activity",
              description:
                "Allow the application to sign your activity before storing it into your data wallet.",
            },
          },
        },
      });

      await window.wallet.init();
      console.log("Wallet initialized successfully");
    }

    return window.wallet;
  } catch (error: any) {
    window.wallet = undefined;
    console.error("Wallet initialization error:", error?.message);
    return null;
  }
};

const initializeSignerAndCipher = async (wallet: EmbedWallet) => {
  try {
    console.log("Initializing signer and cipher...");

    const cereWalletSigner = new CereWalletSigner(wallet);
    const cereWalletCipher = new CereWalletCipher(wallet);

    await cereWalletSigner.isReady();
    await cereWalletCipher.isReady();

    window.walletSigner = cereWalletSigner;
    window.walletCipher = cereWalletCipher;

    console.log("Signer and cipher initialized successfully");
    return true;
  } catch (error: any) {
    console.error("Signer and cipher initialization error:", error?.message);
    window.walletSigner = undefined;
    window.walletCipher = undefined;
    return false;
  }
};

const initializeEventSource = async (
  signer: CereWalletSigner,
  cipher: CereWalletCipher,
) => {
  try {
    console.log("Initializing event source...");

    // Hard-coded configuration
    const config = {
      appId: "2106",
      dispatchUrl: "https://ai-event.stage.cere.io",
      listenUrl: "https://ai-socket.stage.cere.io",
      dataServicePubKey:
        "0xb11934991c15140fdeeca5eee24943ead7768607a8c1481533d76d0df193df73",
      appPubKey:
        "0x0194029faab429f9e565b400a75cf7bb5b6fabe790f13b38ef32687b31b61d12",
    };

    console.log("Creating event source with config:", {
      appId: config.appId,
      dispatchUrl: config.dispatchUrl,
      listenUrl: config.listenUrl,
    });

    const eventSource = new EventSource(signer, cipher, config);

    await eventSource.connect();
    window.eventSource = eventSource;
    console.log("Event source initialized and connected successfully");
    return true;
  } catch (error: any) {
    console.error("Event source initialization error:", error);
    window.eventSource = undefined;
    return false;
  }
};

export function useWallet() {
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  const connect = useCallback(async () => {
    try {
      setIsInitializing(true);
      setInitializationError(null);

      const wallet = await initializeWallet();
      console.log("Attempting to connect wallet...");

      if (!wallet) {
        throw new Error("Failed to initialize wallet");
      }

      await wallet.connect();
      const accounts = await wallet.getAccounts();
      console.log("Wallet connected successfully");

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts available");
      }

      const initSuccess = await initializeSignerAndCipher(wallet);
      if (!initSuccess) {
        throw new Error("Failed to initialize signer and cipher");
      }

      if (window.walletSigner && window.walletCipher) {
        const eventSourceSuccess = await initializeEventSource(
          window.walletSigner,
          window.walletCipher,
        );
        if (!eventSourceSuccess) {
          console.warn(
            "Event source initialization failed, continuing without it",
          );
        }
      }

      toast({
        title: "Wallet Connected",
        description: "Your wallet is now connected and ready to use",
        duration: 3000,
      });

      return accounts;
    } catch (error: any) {
      if (
        error?.message?.includes("User closed the window") ||
        error?.message?.includes("User has closed the login modal")
      ) {
        console.log("User closed the wallet window");
        window.wallet = undefined;
        return null;
      }

      const errorMessage = error?.message || "Failed to connect to wallet";
      setInitializationError(errorMessage);

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });

      window.wallet = undefined;
      window.walletSigner = undefined;
      window.walletCipher = undefined;
      window.eventSource = undefined;
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [toast]);

  const disconnect = useCallback(async () => {
    try {
      if (window.wallet) {
        await window.wallet.disconnect();
        console.log("Wallet disconnected successfully");

        toast({
          title: "Disconnected",
          description: "Wallet has been disconnected successfully",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Disconnect error:", error?.message);
    } finally {
      window.wallet = undefined;
      window.walletSigner = undefined;
      window.walletCipher = undefined;
      window.eventSource = undefined;
      setInitializationError(null);
    }
  }, [toast]);

  return {
    connect,
    disconnect,
    isInitializing,
    initializationError,
  };
}
