import { CereWalletSigner } from "@cere-activity-sdk/signers";
import { CereWalletCipher } from "@cere-activity-sdk/ciphers";
import { NoOpCipher } from "@cere-activity-sdk/ciphers";
import { EventSource, ActivityEvent } from "@cere-activity-sdk/events";
import { useToast } from "@/hooks/use-toast";

export function useDataActivity() {
  const { toast } = useToast();

  const sendEvent = async (eventSource: EventSource) => {
    try {
      console.log("Preparing to send activity event...");
      const payload = {
        anyParam: "test event",
      };

      const activityEvent = new ActivityEvent("TG_DAPP_QUEST", payload);
      console.log("Dispatching event:", activityEvent);

      await eventSource.dispatchEvent(activityEvent);
      console.log("Event dispatched successfully");

      toast({
        title: "Success",
        description: "Activity event sent successfully!",
        duration: 3000,
      });

      return true;
    } catch (error: any) {
      console.error("Error sending activity event:", error);

      toast({
        title: "Error",
        description: error.message || "Failed to send activity event",
        variant: "destructive",
        duration: 5000,
      });

      return false;
    }
  };

  const initializeEventSource = async (wallet: any) => {
    try {
      console.log("Initializing signer and cipher for activity...");
      const cereWalletSigner = new CereWalletSigner(wallet);
      const cereWalletCipher = new NoOpCipher();

      await cereWalletSigner.isReady();
      await cereWalletCipher.isReady();

      console.log("Signer and cipher initialized successfully");

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

      const eventSource = new EventSource(
        cereWalletSigner,
        cereWalletCipher,
        config,
      );

      try {
        await eventSource.connect();
        console.log("Event source connected successfully");

        toast({
          title: "Success",
          description: "Connection established successfully!",
          duration: 3000,
        });

        return eventSource;
      } catch (connError: any) {
        console.error("Connection error:", connError);
        throw new Error(`Connection failed: ${connError.message}`);
      }
    } catch (error: any) {
      console.error("Event source initialization error:", error);

      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });

      return null;
    }
  };

  return {
    initializeEventSource,
    sendEvent,
  };
}
