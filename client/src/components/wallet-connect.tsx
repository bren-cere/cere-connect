import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet";
import { useDataActivity } from "@/lib/data-activity";
import { useState } from "react";
import { Loader2, XCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export function WalletConnect() {
  const { connect, disconnect, isInitializing, initializationError } = useWallet();
  const { initializeEventSource, sendEvent } = useDataActivity();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [isSendingActivity, setIsSendingActivity] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const newAccounts = await connect();
      if (newAccounts) {
        setAccounts(newAccounts);
      }
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setAccounts([]);
  };

  const handleSendActivity = async () => {
    if (!window.wallet || accounts.length === 0) {
      toast({
        title: "Error",
        description: "Wallet must be connected to send activity",
        variant: "destructive",
      });
      return;
    }

    setIsSendingActivity(true);
    try {
      const eventSource = await initializeEventSource(window.wallet);
      if (eventSource) {
        await sendEvent(eventSource);
      } else {
        throw new Error("Failed to initialize event source");
      }
    } catch (error: any) {
      console.error('Activity error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send activity",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSendingActivity(false);
    }
  };

  if (accounts.length > 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="break-all text-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Connected Account</span>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </div>
              {accounts.map((account) => (
                <div key={account.address} className="p-3 bg-muted rounded-lg mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground capitalize bg-background px-2 py-1 rounded">
                      {account.type}
                    </span>
                    {account.name && (
                      <span className="text-xs text-muted-foreground">
                        {account.name}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-xs">{account.address}</span>
                </div>
              ))}
            </div>
            <Button
              className="w-full"
              onClick={handleSendActivity}
              disabled={isSendingActivity}
            >
              {isSendingActivity ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Activity...
                </>
              ) : (
                "Send Activity Event"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {initializationError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{initializationError}</AlertDescription>
        </Alert>
      )}

      <Button
        className="w-full"
        onClick={handleConnect}
        disabled={isInitializing}
      >
        {isInitializing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Initializing...
          </>
        ) : (
          "Connect Wallet"
        )}
      </Button>
    </div>
  );
}