import { useSearch } from "wouter";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import TicketForm from "@/components/TicketForm";
import FeatureRequestForm from "@/components/FeatureRequestForm";
import { Button } from "@/components/ui/button";

export default function Submit() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const type = params.get("type");

  if (type === "feature") {
    return (
      <div className="space-y-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
        <FeatureRequestForm />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      </Link>
      <TicketForm />
    </div>
  );
}
