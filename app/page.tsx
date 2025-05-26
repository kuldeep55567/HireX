import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Search, Mail, PlayCircle, Award, UserCheck, BarChart3, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  // Define the workflow steps
  const steps = [
    {
      number: 1,
      title: "Define Your Requirements",
      description: "Specify the role, experience level, and skills you're looking for."
    },
    {
      number: 2,
      title: "Automated Candidate Sourcing",
      description: "Our AI scans platforms to find matching candidates and collects their contact information."
    },
    {
      number: 3,
      title: "Send Assessments",
      description: "With one click, send personalized emails with custom assessments to candidates."
    },
    {
      number: 4,
      title: "Candidate Evaluation",
      description: "Candidates complete quizzes and video responses which are automatically scored."
    },
    {
      number: 5,
      title: "Review Results",
      description: "Access detailed reports and rankings of your candidates based on performance."
    },
    {
      number: 6,
      title: "Make Informed Decisions",
      description: "Select the best candidates for interviews with confidence, backed by data."
    }
  ];
  
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Revolutionize Your Hiring Process with AI
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Automate candidate sourcing, assessment, and evaluation with our powerful AI-driven platform.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="group">
                  <Link href="/openings">
                    Get Started <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#how-it-works">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative lg:pl-6">
              <div className="relative mx-auto aspect-video overflow-hidden rounded-xl border shadow-xl">
                <Image
                  src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                  alt="HR professionals reviewing candidates"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-12 md:py-24 bg-blue-50 dark:bg-blue-900/20 rounded-3xl">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Powerful Features
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                Our platform helps you streamline every aspect of the recruitment process
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 pt-12">
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <Search className="h-6 w-6 text-primary mb-2" />
                <CardTitle>Candidate Sourcing</CardTitle>
                <CardDescription>
                  Automatically find qualified candidates across LinkedIn and other platforms.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Simply specify the role and experience level, and our AI does the rest, identifying the most promising talent.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <Mail className="h-6 w-6 text-primary mb-2" />
                <CardTitle>Automated Outreach</CardTitle>
                <CardDescription>
                  Send personalized assignments and assessments via email in one click.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create custom email templates and assessment sequences that automatically adapt to each candidate.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <PlayCircle className="h-6 w-6 text-primary mb-2" />
                <CardTitle>Video Assessments</CardTitle>
                <CardDescription>
                  Evaluate candidates through recorded video responses to technical questions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our platform includes tools for creating custom video interview questions tailored to each position.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <Award className="h-6 w-6 text-primary mb-2" />
                <CardTitle>Comprehensive Quizzes</CardTitle>
                <CardDescription>
                  Create custom technical assessments to evaluate candidates' skills.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Build quizzes with multiple choice, coding challenges, and other question types to test technical abilities.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <BarChart3 className="h-6 w-6 text-primary mb-2" />
                <CardTitle>AI-Powered Scoring</CardTitle>
                <CardDescription>
                  Automatically evaluate and rank candidates based on their performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our intelligent scoring system analyzes answers, code quality, communication skills, and more.
                </p>
              </CardContent>
            </Card>
            <Card className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <UserCheck className="h-6 w-6 text-primary mb-2" />
                <CardTitle>Talent Analytics</CardTitle>
                <CardDescription>
                  Gain insights into your candidate pool and hiring process.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track metrics on sourcing channels, response rates, assessment performance, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-12 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              How It Works
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
              Our streamlined process makes hiring exceptional talent faster and more efficient
            </p>
          </div>
        </div>
        
        {/* Mobile view - stacked cards */}
        <div className="md:hidden space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="bg-card rounded-lg p-6 shadow-sm border">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold">{step.title}</h3>
              </div>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        
        {/* Desktop view - zigzag layout with connecting dots */}
        <div className="hidden md:block">
          <div className="relative">
            {/* Vertical line in the middle */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-dotted-line z-0 border-l-2 border-dashed border-primary/30"></div>
            
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              
              return (
                <div 
                  key={step.number} 
                  className={`relative z-10 flex items-center mb-20 ${isEven ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Connecting dot */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary/60"></div>
                  
                  {/* Content card */}
                  <div className={`w-5/12 bg-card rounded-lg p-6 shadow-md border ${isEven ? 'mr-auto' : 'ml-auto'}`}>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                        {step.number}
                      </div>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  
                  {/* Horizontal line connecting to the center */}
                  <div 
                    className={`absolute top-1/2 h-0.5 bg-primary/30 ${
                      isEven ? 'left-[calc(5/12*100%)] right-1/2' : 'right-[calc(5/12*100%)] left-1/2'
                    }`}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>


      {/* Testimonials */}
      <section className="w-full py-12 md:py-24 bg-blue-50 dark:bg-blue-900/20 rounded-3xl">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Trusted by Industry Leaders
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                See how our platform is transforming hiring processes
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 md:grid-cols-2 gap-8 pt-12">
            <div className="flex flex-col p-6 bg-background rounded-xl shadow-sm border">
              <p className="text-lg mb-4">
                "This platform completely transformed our hiring process. We've reduced our time-to-hire by 60% while finding higher quality candidates than ever before."
              </p>
              <div className="flex items-center mt-auto">
                <div className="rounded-full bg-primary/20 p-1 mr-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">HR Director, TechCorp</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col p-6 bg-background rounded-xl shadow-sm border">
              <p className="text-lg mb-4">
                "The automated assessment features have been a game-changer. We can now evaluate hundreds of candidates with precision, without the manual workload."
              </p>
              <div className="flex items-center mt-auto">
                <div className="rounded-full bg-primary/20 p-1 mr-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Michael Chen</p>
                  <p className="text-sm text-muted-foreground">Talent Acquisition Lead, InnoSoft</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-12 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Transform Your Hiring Process?
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                Join thousands of companies using our platform to find the best talent faster.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="group">
                <Link href="/openings">
                  Get Started <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#features">
                  Explore Features
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}