import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface RefreshOverlayProps {
  onRetry: () => void;
}

export function RefreshOverlay({ onRetry }: RefreshOverlayProps) {
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Workspace Loading Error
          </DialogTitle>
          <DialogDescription>
            There was an issue loading the workspace. This can happen due to network connectivity issues or server problems.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 font-medium text-sm">What you can try:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Click "Retry" to attempt loading again</li>
              <li>• Check your internet connection</li>
              <li>• Refresh your browser if the issue persists</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Browser
          </Button>
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
