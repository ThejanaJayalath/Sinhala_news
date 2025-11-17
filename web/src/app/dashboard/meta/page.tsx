import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MetaPage() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="font-display text-3xl font-semibold">Meta</h1>
        <p className="text-muted-foreground">
          Analytics, metrics, and insights for your news automation system.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Analytics and metrics dashboard will be available here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

