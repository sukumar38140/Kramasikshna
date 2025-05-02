import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();

  // Use useEffect for navigation to avoid React state updates during render
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // If user is logged in, don't render the auth page
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
      {/* Left column - auth forms */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Tabs defaultValue="login" className="w-full max-w-md">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm isLoading={loginMutation.isPending} onSubmit={(data) => loginMutation.mutate(data)} />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm isLoading={registerMutation.isPending} onSubmit={(data) => registerMutation.mutate(data)} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right column - hero section */}
      <div className="flex-1 bg-primary-500 text-white p-8 flex flex-col justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url(/images/hero-pattern.svg)', backgroundSize: 'cover' }}></div>
        
        <div className="max-w-lg mx-auto relative z-10">
          <div className="flex items-center mb-6">
            <img src="/images/discipline-icon.svg" alt="Discipline icon" className="w-16 h-16 mr-4" />
            <div>
              <h1 className="text-4xl font-bold">Discipline Never Fails</h1>
              <p className="text-xl text-primary-100">Build Habits, Conquer Challenges, Become Unstoppable!</p>
            </div>
          </div>
          
          <div className="space-y-6 mb-8">
            <div className="flex items-start bg-primary-600/30 p-4 rounded-lg backdrop-blur-sm">
              <img src="/images/mountain-climb.svg" alt="Challenge journey" className="w-36 h-24 mr-4" />
              <div>
                <h3 className="font-semibold text-lg">Create Challenges</h3>
                <p className="text-primary-100">Create 21-day, 45-day, or custom duration challenges to build lasting discipline and transform your habits.</p>
              </div>
            </div>
            
            <div className="flex items-start bg-primary-600/30 p-4 rounded-lg backdrop-blur-sm">
              <img src="/images/streak-flame.svg" alt="Streak flame" className="w-16 h-16 mr-4" />
              <div>
                <h3 className="font-semibold text-lg">Maintain Streaks</h3>
                <p className="text-primary-100">Once committed, tasks can't be deleted. Build real discipline with real accountability through consistent action.</p>
              </div>
            </div>
            
            <div className="flex items-start bg-primary-600/30 p-4 rounded-lg backdrop-blur-sm">
              <img src="/images/achievement-badge.svg" alt="Achievement badge" className="w-16 h-20 mr-4" />
              <div>
                <h3 className="font-semibold text-lg">Earn Achievements</h3>
                <p className="text-primary-100">Track your progress, earn badges, and share your discipline journey with others for accountability.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm border border-white/20">
            <img src="/images/progress-chart.svg" alt="Progress chart" className="w-full h-auto mb-3" />
            <p className="italic text-center text-lg">
              "Discipline is the bridge between goals and accomplishment."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit, isLoading }: { onSubmit: (data: LoginFormValues) => void, isLoading: boolean }) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Enter your credentials to continue your discipline journey</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <i className="fas fa-sign-in-alt mr-2" />}
              Login
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RegisterForm({ onSubmit, isLoading }: { onSubmit: (data: RegisterFormValues) => void, isLoading: boolean }) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Join today and start your discipline journey</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <i className="fas fa-user-plus mr-2" />}
              Register
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
