import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get verification parameters from URL
        const token = searchParams.get("token");
        const type = searchParams.get("type");
        
        if (!token || type !== "email") {
          setVerificationStatus("error");
          setErrorMessage("Invalid verification link");
          return;
        }
        
        // Verify the token
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: "email",
        });
        
        if (error) {
          console.error("Verification error:", error);
          setVerificationStatus("error");
          setErrorMessage(error.message);
        } else {
          setVerificationStatus("success");
          
          // Wait a bit before redirecting
          setTimeout(() => {
            navigate("/auth?verification=success");
          }, 3000);
        }
      } catch (error) {
        console.error("Verification process error:", error);
        setVerificationStatus("error");
        setErrorMessage("An unexpected error occurred during verification");
      }
    };
    
    verifyEmail();
  }, [searchParams, navigate]);
  
  // Redirect if user is already verified
  useEffect(() => {
    if (user?.email_confirmed_at) {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">Email Verification</CardTitle>
          <CardDescription>
            {verificationStatus === "loading" && "Verifying your email..."}
            {verificationStatus === "success" && "Your email has been verified!"}
            {verificationStatus === "error" && "Verification failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-6 pt-6">
          {verificationStatus === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {verificationStatus === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">Email verification successful!</p>
                <p className="text-sm text-muted-foreground">
                  Your email has been verified. You will be redirected to the login page shortly.
                </p>
              </div>
            </div>
          )}

          {verificationStatus === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-red-100 p-3">
                <X className="h-10 w-10 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-medium">Verification failed</p>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || "There was a problem verifying your email."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate("/auth")}
          >
            {verificationStatus === "success" ? "Continue to Login" : "Back to Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}