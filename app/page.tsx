import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Search, Mail, PlayCircle, Award, UserCheck, BarChart3, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
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
                  <Link href="/login">
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
      <section id="features" className="w-full py-12 md:py-24 bg-secondary/30 rounded-xl">
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
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                How It Works
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mx-auto">
                Our streamlined process makes hiring exceptional talent faster and more efficient
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 pt-12">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-bold">Define Your Requirements</h3>
              <p className="text-muted-foreground">
                Specify the role, experience level, and skills you're looking for.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                2
              </div>
              <h3 className="text-xl font-bold">Automated Candidate Sourcing</h3>
              <p className="text-muted-foreground">
                Our AI scans platforms to find matching candidates and collects their contact information.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                3
              </div>
              <h3 className="text-xl font-bold">Send Assessments</h3>
              <p className="text-muted-foreground">
                With one click, send personalized emails with custom assessments to candidates.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                4
              </div>
              <h3 className="text-xl font-bold">Candidate Evaluation</h3>
              <p className="text-muted-foreground">
                Candidates complete quizzes and video responses which are automatically scored.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                5
              </div>
              <h3 className="text-xl font-bold">Review Results</h3>
              <p className="text-muted-foreground">
                Access detailed reports and rankings of your candidates based on performance.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                6
              </div>
              <h3 className="text-xl font-bold">Make Informed Decisions</h3>
              <p className="text-muted-foreground">
                Select the best candidates for interviews with confidence, backed by data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full py-12 md:py-24 bg-muted/50 rounded-xl">
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
                <Link href="/login">
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