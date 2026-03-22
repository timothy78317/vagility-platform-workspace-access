import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-6 text-center">
      <div className="space-y-4">
        <h1 className="text-9xl font-black text-accent/20">404</h1>
        <h2 className="text-3xl font-bold text-foreground">Secure Route Unavailable</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          The requested identity or access resource could not be found or your permission has timed out.
        </p>
      </div>
      
      <Link to="identity">
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold h-11 px-8 gap-2 group transition-all">
          <MoveLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          Retreat to Identity
        </Button>
      </Link>
    </div>
  );
}
