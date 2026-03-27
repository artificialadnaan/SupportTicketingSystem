import { Route, Switch } from "wouter";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Submit from "@/pages/Submit";
import Track from "@/pages/Track";
import Admin from "@/pages/Admin";

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/submit" component={Submit} />
        <Route path="/track" component={Track} />
        <Route path="/admin" component={Admin} />
        <Route>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}
