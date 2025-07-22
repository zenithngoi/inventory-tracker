import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AlertCircle, Mail, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().min(6, "Phone number is required"),
  region_code: z.string().min(1, "Region code is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, isSupabaseEnabled, user, resendVerificationEmail, isEmailVerified } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const isRegisterPage = location.pathname === "/register";

  // Initialize forms
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      full_name: "",
      phone: "",
      region_code: "+1",
    },
  });

  // Redirect destination after login
  const from = (location.state as any)?.from?.pathname || "/";

  // Check if email verification is needed
  useEffect(() => {
    // If user is logged in but email is not verified
    if (user && !isEmailVerified()) {
      setShowVerificationPrompt(true);
      setVerificationEmail(user.email || "");
    } else {
      setShowVerificationPrompt(false);
    }
  }, [user]);

  // Handle verification from URL
  useEffect(() => {
    // Check if URL contains email verification parameters
    const params = new URLSearchParams(window.location.search);
    const verificationMode = params.get('verification');
    
    if (verificationMode === 'success') {
      toast.success("Email successfully verified! You can now login.");
    } else if (verificationMode === 'error') {
      toast.error("There was a problem verifying your email. Please try again.");
    }
  }, [location]);

  // Handle login submit
  const onLoginSubmit = async (data: LoginFormValues) => {
    setAuthError(null);
    
    if (!isSupabaseEnabled) {
      toast.error("Cloud storage is not configured. Please connect to Supabase.");
      return;
    }
    
    const { error } = await signIn(data);
    
    if (error) {
      setAuthError(error.message);
      return;
    }
    
    // Note: We handle the verification prompt in the useEffect above
    toast.success("Login successful");
    navigate(from);
  };

  // Handle register submit
  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setAuthError(null);
    
    if (!isSupabaseEnabled) {
      toast.error("Cloud storage is not configured. Please connect to Supabase.");
      return;
    }
    
    const { error, user } = await signUp(data);
    
    if (error) {
      setAuthError(error.message);
      return;
    }
    
    setVerificationEmail(data.email);
    
    // Show verification message
    toast.success("Registration successful! Please check your email to verify your account.", {
      duration: 6000,
    });
    
    // Switch to verification sent screen
    setActiveTab("verification");
  };
  
  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!verificationEmail) {
      toast.error("Email address is required");
      return;
    }
    
    setIsResendingVerification(true);
    
    const { error } = await resendVerificationEmail(verificationEmail);
    
    if (error) {
      toast.error(error.message || "Failed to resend verification email");
    } else {
      toast.success("Verification email sent! Please check your inbox and spam folders.");
    }
    
    setIsResendingVerification(false);
  };
  
  // Region code options
  const regionCodes = [
    { value: "+1", label: "+1 (USA/Canada)" },
    { value: "+44", label: "+44 (UK)" },
    { value: "+61", label: "+61 (Australia)" },
    { value: "+33", label: "+33 (France)" },
    { value: "+49", label: "+49 (Germany)" },
    { value: "+81", label: "+81 (Japan)" },
    { value: "+86", label: "+86 (China)" },
    { value: "+91", label: "+91 (India)" },
    { value: "+55", label: "+55 (Brazil)" },
    { value: "+52", label: "+52 (Mexico)" },
  ];

  // Set initial tab based on URL
  useEffect(() => {
    if (isRegisterPage) {
      setActiveTab("register");
    }

    // Check for verification parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('verification') === 'pending') {
      const email = params.get('email');
      if (email) {
        setVerificationEmail(email);
        setActiveTab("verification");
      }
    }
  }, [isRegisterPage]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-primary"
            >
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
              <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
              <path d="M12 3v6" />
            </svg>
            <h1 className="text-3xl font-bold">Inventory Manager</h1>
          </div>
          <p className="mt-2 text-gray-600">
            Manage your inventory efficiently
          </p>
        </div>

        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <Tabs
              defaultValue={activeTab}
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
                <TabsTrigger value="verification">Verify</TabsTrigger>
              </TabsList>
              
              {authError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              {!isSupabaseEnabled && (
                <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cloud storage is not configured. Connect to Supabase to enable user authentication.
                  </AlertDescription>
                </Alert>
              )}
              
              {showVerificationPrompt && (
                <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Email verification required</AlertTitle>
                  <AlertDescription>
                    Please verify your email address to access all features.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-amber-800 font-medium" 
                      onClick={() => setActiveTab("verification")}
                    >
                      Resend verification email
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <TabsContent value="login" className="pt-2">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="******"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!isSupabaseEnabled || loginForm.formState.isSubmitting}
                    >
                      {loginForm.formState.isSubmitting
                        ? "Logging in..."
                        : "Login"}
                    </Button>
                    <div className="text-center text-sm">
                      <a
                        href="#"
                        className="text-primary hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          // Handle forgot password
                        }}
                      >
                        Forgot password?
                      </a>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="pt-2">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="you@example.com"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John Doe"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-5 gap-2">
                      <FormField
                        control={registerForm.control}
                        name="region_code"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Region</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regionCodes.map(code => (
                                  <SelectItem key={code.value} value={code.value}>
                                    {code.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="col-span-3">
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="1234567890"
                                type="tel"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="******"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Must be at least 6 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!isSupabaseEnabled || registerForm.formState.isSubmitting}
                    >
                      {registerForm.formState.isSubmitting
                        ? "Registering..."
                        : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="verification" className="pt-2">
                <div className="space-y-4 py-4">
                  <div className="flex flex-col items-center justify-center space-y-2 text-center">
                    <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center">
                      <Mail className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium">Verify your email</h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      We've sent a verification email to{" "}
                      <span className="font-medium">{verificationEmail}</span>. 
                      Please check your inbox and click the verification link.
                    </p>
                  </div>
                  
                  <Alert className="bg-blue-50 border-blue-100 text-blue-700">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Email sent!</AlertTitle>
                    <AlertDescription>
                      If you don't see the email, check your spam folder.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant="outline"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="w-full"
                    >
                      {isResendingVerification ? "Sending..." : "Resend verification email"}
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => setActiveTab("login")}
                      className="w-full"
                    >
                      Back to login
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}