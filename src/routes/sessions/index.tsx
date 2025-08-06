import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SessionItem } from "@/components/sessions/SessionItem";
import { useSessionAPI } from "@/hooks/use-session-api";
import { useMachine } from "@/hooks/use-machine";
import { UserFilterSelect } from "@/components/user-filter-select";
import { Loader2, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/sessions/")({
  component: SessionsOverview,
}) as any;

function MachineGroup({
  machineId,
  sessions,
  onDelete,
}: {
  machineId: string | null;
  sessions: any[];
  onDelete: (sessionId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const { data: machine } = useMachine(machineId || undefined);

  const machineName =
    machine?.name || (machineId ? `Machine ${machineId}` : "Unknown Machine");

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <Server className="h-4 w-4" />
            <span className="font-medium">{machineName}</span>
            <Badge variant="secondary" className="text-xs">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pl-4">
        {sessions.map((session, index) => (
          <SessionItem
            key={session.session_id}
            session={session}
            index={index}
            onDelete={onDelete}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SessionsOverview() {
  const { listSession, deleteSession } = useSessionAPI();
  const { data: sessions, isLoading } = listSession;
  const [userFilter, setUserFilter] = useState<string>("");

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await deleteSession.mutateAsync({
        sessionId: sessionId,
        // waitForShutdown: true,
      });
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleUserFilterChange = (userIds: string) => {
    setUserFilter(userIds);
  };

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];

    if (!userFilter) return sessions;

    const selectedUserIds = userFilter.split(",").filter(Boolean);
    return sessions.filter((session) =>
      selectedUserIds.includes(session.user_id),
    );
  }, [sessions, userFilter]);

  const groupedSessions = useMemo(() => {
    if (!filteredSessions) return {};

    return filteredSessions.reduce(
      (groups, session) => {
        const machineId = session.machine_id || null;
        if (!groups[machineId]) {
          groups[machineId] = [];
        }
        groups[machineId].push(session);
        return groups;
      },
      {} as Record<string | null, any[]>,
    );
  }, [filteredSessions]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          <UserFilterSelect onFilterChange={handleUserFilterChange} />
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          <UserFilterSelect onFilterChange={handleUserFilterChange} />
        </div>
        <div className="text-center py-8 text-muted-foreground">
          No active sessions found
        </div>
      </div>
    );
  }

  const totalFilteredSessions = Object.values(groupedSessions).flat().length;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Active Sessions</h1>
          {userFilter && (
            <Badge variant="outline" className="text-sm">
              {totalFilteredSessions} of {sessions.length} sessions
            </Badge>
          )}
        </div>
        <UserFilterSelect onFilterChange={handleUserFilterChange} />
      </div>

      {Object.keys(groupedSessions).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No sessions found for the selected filter
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedSessions).map(
            ([machineId, machineSessions]) => (
              <div
                key={machineId || "unknown"}
                className="border rounded-lg bg-card"
              >
                <MachineGroup
                  machineId={machineId}
                  sessions={machineSessions}
                  onDelete={handleSessionDelete}
                />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
