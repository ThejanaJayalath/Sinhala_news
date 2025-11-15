"use client";

import { Activity, Bell, Calendar, LayoutPanelLeft, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const queue = [
  { title: "Global headlines ingest", status: "Idle", eta: "3m", category: "World" },
  { title: "Anime RSS summarizer", status: "Running", eta: "45s", category: "Culture" },
  { title: "Cinema poster generator", status: "Queued", eta: "10m", category: "Entertainment" },
];

const notifications = [
  { icon: Activity, text: "New breaking news source added: BBC World.", time: "2m" },
  { icon: Shield, text: "Moderation policy updated for elections coverage.", time: "1h" },
  { icon: Calendar, text: "5 posts scheduled for tomorrow morning.", time: "3h" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Sinhala AI Ops</p>
          <h1 className="font-display text-3xl font-semibold">Command dashboard</h1>
          <p className="text-muted-foreground">
            Review ingestion jobs, AI pipelines, and scheduled posts at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </Button>
          <Button size="sm" className="gap-2">
            <LayoutPanelLeft className="h-4 w-4" />
            Configure pipeline
          </Button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline queue</CardTitle>
            <CardDescription>Track ingestion, AI, and publish job states.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((job) => (
                <TableRow key={job.title}>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.category}</Badge>
                  </TableCell>
                  <TableCell>{job.status}</TableCell>
                  <TableCell>{job.eta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ops notifications</CardTitle>
            <CardDescription>Real-time feed from moderation + scheduling services.</CardDescription>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            {notifications.map(({ icon: Icon, text, time }) => (
              <div key={text} className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm text-foreground/90">{text}</p>
                </div>
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

