import { Link } from "wouter";
import { Bug, Lightbulb, Search, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#1e3a5f]">
          How can we help?
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Report issues, request features, or track the status of your existing tickets.
          We're here to make sure your tools work the way they should.
        </p>
      </div>

      {/* Action cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Link href="/submit?type=bug">
          <Card className="group cursor-pointer hover:shadow-lg hover:border-red-200 transition-all h-full">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <Bug className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold">Report an Issue</h2>
              <p className="text-muted-foreground text-sm">
                Something not working in Procore, HubSpot, or SyncHub?
                Tell us what happened and we'll get on it.
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-red-600 group-hover:gap-2 transition-all">
                Report Issue <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/submit?type=feature">
          <Card className="group cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all h-full">
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Lightbulb className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold">Request a Feature</h2>
              <p className="text-muted-foreground text-sm">
                Have an idea to improve your workflow? Suggest a feature
                or a better way to do things.
              </p>
              <div className="flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:gap-2 transition-all">
                Request Feature <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Track tickets */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Already submitted a ticket?</p>
                <p className="text-sm text-muted-foreground">
                  Track its status and see updates.
                </p>
              </div>
            </div>
            <Link href="/track">
              <Button variant="outline">Track My Tickets</Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <div className="max-w-4xl mx-auto">
        <h3 className="text-lg font-semibold mb-4 text-[#1e3a5f]">Tips for Faster Resolution</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: "Be Specific",
              desc: "Include exactly what you clicked, what page you were on, and what you expected to happen.",
            },
            {
              title: "Attach Screenshots",
              desc: "A picture is worth a thousand words. Capture the error or the screen where the issue occurred.",
            },
            {
              title: "Note the Time",
              desc: "Knowing when the issue happened helps us find the exact logs and trace the root cause.",
            },
          ].map((tip) => (
            <Card key={tip.title} className="bg-white">
              <CardContent className="p-5">
                <h4 className="font-medium mb-1">{tip.title}</h4>
                <p className="text-sm text-muted-foreground">{tip.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
