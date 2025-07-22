import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Page not found</p>
      <Link to="/">
        <Button className="flex items-center gap-2">
          <Home className="h-4 w-4" />
          Return Home
        </Button>
      </Link>
    </div>
  );
}