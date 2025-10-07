"use client";

// Removed 'useState' and 'Input' imports as they are no longer needed
import { Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CaseItem } from "@/lib/casesStore";
import { redirect } from "next/navigation";

interface CaseCardProps {
  caseData: Pick<
    CaseItem,
    | "id"
    | "title"
    | "status"
    | "createdAt"
    | "summary"
    | "applicantName"
    | "postalCode"
    | "confirm_url" // The prop that receives the dynamic link
  >;
  onViewDetails: () => void;
}

export function CaseCard({ caseData, onViewDetails }: CaseCardProps) {
  
  const handleConfirm = async () => {
    try {
      // 1. Use the URL directly from props
      const url = caseData.confirm_url;

      if (!url) {
        // This should theoretically not happen if the button is disabled,
        // but it's a good safeguard.
        alert("Der Link wurde noch nicht zugewiesen.");
        return;
      }

      // 2. Perform the GET request to the assigned link
      window.location.href = url;

      console.log("[v0] Case confirmed (GET request):", caseData.id, "to URL:", url);
    } catch (error) {
      console.error("[v0] Error confirming case:", error);
    }
  };

  const statusColor =
    caseData.status === "Offen"
      ? "bg-chart-4/20 text-chart-4"
      : "bg-primary/20 text-primary";

  // 3. Logic to determine if the button should be active
  const isUrlSet = !!caseData.confirm_url;

  return (
    <Card className="group bg-card border-border transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <CardHeader className="space-y-3">
        {/* ... (Header content remains the same) ... */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="font-mono text-sm text-muted-foreground">
              Case #{caseData.id}
            </p>
            <h3 className="font-semibold text-foreground leading-tight">
              {caseData.title}
            </h3>
          </div>
          <Badge className={`${statusColor} border-0 font-medium`}>
            {caseData.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* ... (Details content remains the same) ... */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(caseData.createdAt).toLocaleDateString("de-DE")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{caseData.summary}</span>
        </div>
        
        {/* Optional: Show status message */}
        {!isUrlSet && (
             <p className="text-sm font-medium text-red-500 pt-2">
                ⚠️ Warte auf Zuweisung eines Bestätigungs-Links.
             </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 border-border text-foreground hover:bg-secondary bg-transparent"
          onClick={onViewDetails}
        >
          Details anzeigen
        </Button>
        <Button
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleConfirm}
          // 4. THE KEY: Disable if the URL is not set
          disabled={!isUrlSet} 
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Bestätigen
        </Button>
      </CardFooter>
    </Card>
  );
}