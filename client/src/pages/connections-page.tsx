import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus, Check, X, Share } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Types
interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Connection {
  id: number;
  userId: number;
  connectedUserId: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SharedNote {
  note: {
    id: number;
    taskId: number;
    date: string;
    status: string;
    hoursSpent: number | null;
    notes: string | null;
    imageUrl: string | null;
    createdAt: string;
  };
  sharedBy: User;
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState("connections");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Fetch connections
  const { 
    data: connections,
    isLoading: isLoadingConnections,
    error: connectionsError 
  } = useQuery({
    queryKey: ["/api/user/connections"],
    enabled: !!user,
  });

  // Fetch connected users
  const { 
    data: connectedUsers,
    isLoading: isLoadingConnectedUsers,
    error: connectedUsersError 
  } = useQuery({
    queryKey: ["/api/user/connected-users"],
    enabled: !!user,
  });

  // Fetch shared notes
  const { 
    data: sharedNotes,
    isLoading: isLoadingSharedNotes,
    error: sharedNotesError 
  } = useQuery({
    queryKey: ["/api/user/shared-notes"],
    enabled: !!user,
  });

  // Search users mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/user/search", { query });
      return await response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Connect with user mutation
  const connectMutation = useMutation({
    mutationFn: async (connectedUserId: number) => {
      const response = await apiRequest("POST", "/api/user/connections", { connectedUserId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/connections"] });
      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Accept/Reject connection mutation
  const updateConnectionMutation = useMutation({
    mutationFn: async ({ connectionId, status }: { connectionId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/user/connections/${connectionId}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/connected-users"] });
      toast({
        title: "Connection updated",
        description: "Your connection has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Share note mutation
  const shareNoteMutation = useMutation({
    mutationFn: async ({ taskProgressId, sharedWithUserId }: { taskProgressId: number; sharedWithUserId: number }) => {
      const response = await apiRequest("POST", "/api/user/share-note", { 
        taskProgressId, 
        sharedWithUserId 
      });
      return await response.json();
    },
    onSuccess: () => {
      setShareDialogOpen(false);
      toast({
        title: "Note shared",
        description: "Your note has been shared successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sharing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length > 0) {
      searchMutation.mutate(searchQuery);
    }
  };

  // Get pending requests
  const pendingRequests = connections?.filter(
    (conn: Connection) => conn.connectedUserId === user?.id && conn.status === 'pending'
  ) || [];

  // Get sent requests
  const sentRequests = connections?.filter(
    (conn: Connection) => conn.userId === user?.id && conn.status === 'pending'
  ) || [];

  // Get all connections by status
  const getConnectionsByStatus = (status: string) => {
    return connections?.filter(
      (conn: Connection) => 
        (conn.userId === user?.id || conn.connectedUserId === user?.id) && 
        conn.status === status
    ) || [];
  };

  // Handle share note
  const handleShareNote = (noteId: number) => {
    setSelectedNoteId(noteId);
    setShareDialogOpen(true);
  };

  // Handle share dialog submit
  const handleShareSubmit = () => {
    if (selectedNoteId && selectedUserId) {
      shareNoteMutation.mutate({
        taskProgressId: selectedNoteId,
        sharedWithUserId: selectedUserId
      });
    }
  };

  // Handle viewing a shared note
  const handleViewNote = (note: SharedNote["note"]) => {
    setSelectedNoteId(note.id);
    setNoteDialogOpen(true);
  };

  // Get selected note
  const selectedNote = sharedNotes?.find((note: SharedNote) => note.note.id === selectedNoteId);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Connections</h1>
      
      <Tabs 
        defaultValue="connections" 
        value={selectedTabIndex}
        onValueChange={setSelectedTabIndex}
        className="w-full mb-8"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="search">Find Users</TabsTrigger>
          <TabsTrigger value="shared">Shared Notes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connections" className="space-y-6">
          {isLoadingConnections ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : connectionsError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load connections. Please try again.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connection Requests</CardTitle>
                    <CardDescription>
                      People who want to connect with you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingRequests.map((conn: Connection) => {
                        const requestUser = connectedUsers?.find(
                          (u: User) => u.id === conn.userId
                        );
                        
                        return requestUser ? (
                          <div key={conn.id} className="flex items-center justify-between border-b pb-3">
                            <div>
                              <p className="font-medium">{requestUser.name}</p>
                              <p className="text-sm text-muted-foreground">@{requestUser.username}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateConnectionMutation.mutate({ 
                                  connectionId: conn.id, 
                                  status: 'accepted' 
                                })}
                                disabled={updateConnectionMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateConnectionMutation.mutate({ 
                                  connectionId: conn.id, 
                                  status: 'rejected' 
                                })}
                                disabled={updateConnectionMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {sentRequests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sent Requests</CardTitle>
                    <CardDescription>
                      Connection requests you've sent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sentRequests.map((conn: Connection) => {
                        const sentToUser = connectedUsers?.find(
                          (u: User) => u.id === conn.connectedUserId
                        );
                        
                        return sentToUser ? (
                          <div key={conn.id} className="flex items-center justify-between border-b pb-3">
                            <div>
                              <p className="font-medium">{sentToUser.name}</p>
                              <p className="text-sm text-muted-foreground">@{sentToUser.username}</p>
                            </div>
                            <Badge variant="outline">Pending</Badge>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>My Network</CardTitle>
                  <CardDescription>
                    People you're connected with
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getConnectionsByStatus('accepted').length === 0 ? (
                    <p className="text-muted-foreground py-4">
                      You don't have any connections yet. Search for users to connect with.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {getConnectionsByStatus('accepted').map((conn: Connection) => {
                        const connectedUser = connectedUsers?.find(
                          (u: User) => u.id === (conn.userId === user?.id ? conn.connectedUserId : conn.userId)
                        );
                        
                        return connectedUser ? (
                          <div key={conn.id} className="flex items-center justify-between border-b pb-3">
                            <div>
                              <p className="font-medium">{connectedUser.name}</p>
                              <p className="text-sm text-muted-foreground">@{connectedUser.username}</p>
                            </div>
                            <div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTabIndex("shared");
                                }}
                              >
                                <Share className="h-4 w-4 mr-1" />
                                Share Notes
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Find Users</CardTitle>
              <CardDescription>
                Search for other users to connect with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex space-x-2 mb-6">
                <Input
                  placeholder="Search by username or name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={searchMutation.isPending || !searchQuery.trim()}
                >
                  {searchMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Search className="h-4 w-4 mr-1" />
                  )}
                  Search
                </Button>
              </form>

              {searchMutation.data && searchMutation.data.length > 0 ? (
                <div className="space-y-4">
                  {searchMutation.data.map((foundUser: User) => {
                    // Check if already connected or have pending request
                    const existingConnection = connections?.find(
                      (conn: Connection) => 
                        (conn.userId === user?.id && conn.connectedUserId === foundUser.id) ||
                        (conn.userId === foundUser.id && conn.connectedUserId === user?.id)
                    );
                    
                    const connectionStatus = existingConnection?.status || null;
                    const isCurrentUserRequester = existingConnection?.userId === user?.id;

                    return (
                      <div key={foundUser.id} className="flex items-center justify-between border-b pb-3">
                        <div>
                          <p className="font-medium">{foundUser.name}</p>
                          <p className="text-sm text-muted-foreground">@{foundUser.username}</p>
                        </div>
                        <div>
                          {connectionStatus === 'accepted' ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Connected
                            </Badge>
                          ) : connectionStatus === 'pending' && isCurrentUserRequester ? (
                            <Badge variant="outline">
                              Request Sent
                            </Badge>
                          ) : connectionStatus === 'pending' && !isCurrentUserRequester ? (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateConnectionMutation.mutate({ 
                                  connectionId: existingConnection.id, 
                                  status: 'accepted' 
                                })}
                                disabled={updateConnectionMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateConnectionMutation.mutate({ 
                                  connectionId: existingConnection.id, 
                                  status: 'rejected' 
                                })}
                                disabled={updateConnectionMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => connectMutation.mutate(foundUser.id)}
                              disabled={connectMutation.isPending}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchMutation.isSuccess && searchMutation.data?.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">
                  No users found matching your search.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shared">
          <Card>
            <CardHeader>
              <CardTitle>Shared Notes</CardTitle>
              <CardDescription>
                Notes shared with you by connected users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSharedNotes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : sharedNotesError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Failed to load shared notes. Please try again.
                  </AlertDescription>
                </Alert>
              ) : sharedNotes?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shared By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Time Spent</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharedNotes.map((item: SharedNote) => (
                      <TableRow key={item.note.id}>
                        <TableCell className="font-medium">
                          {item.sharedBy.name}
                        </TableCell>
                        <TableCell>
                          {new Date(item.note.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            item.note.status === 'completed' 
                              ? 'default' 
                              : item.note.status === 'partial' 
                                ? 'secondary' 
                                : 'outline'
                          }>
                            {item.note.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.note.hoursSpent ? `${item.note.hoursSpent}h` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewNote(item.note)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No shared notes yet. Connect with others to share progress!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Dialog for sharing a note */}
          <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share a Note</DialogTitle>
                <DialogDescription>
                  Select a user to share your progress note with
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <Select onValueChange={(value) => setSelectedUserId(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {connectedUsers?.filter((u: User) => 
                      getConnectionsByStatus('accepted').some(
                        (conn: Connection) => 
                          (conn.userId === user?.id && conn.connectedUserId === u.id) ||
                          (conn.userId === u.id && conn.connectedUserId === user?.id)
                      )
                    ).map((connectedUser: User) => (
                      <SelectItem 
                        key={connectedUser.id} 
                        value={connectedUser.id.toString()}
                      >
                        {connectedUser.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={handleShareSubmit} 
                  disabled={!selectedUserId || shareNoteMutation.isPending}
                >
                  {shareNoteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : null}
                  Share
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog for viewing a shared note */}
          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Shared Note</DialogTitle>
                <DialogDescription>
                  Shared by {selectedNote?.sharedBy.name} on {selectedNote?.note.date ? new Date(selectedNote.note.date).toLocaleDateString() : ''}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold">Status</h4>
                  <p>{selectedNote?.note.status}</p>
                </div>
                
                {selectedNote?.note.hoursSpent && (
                  <div>
                    <h4 className="text-sm font-semibold">Time Spent</h4>
                    <p>{selectedNote.note.hoursSpent} hours</p>
                  </div>
                )}
                
                {selectedNote?.note.notes && (
                  <div>
                    <h4 className="text-sm font-semibold">Notes</h4>
                    <p className="whitespace-pre-wrap">{selectedNote.note.notes}</p>
                  </div>
                )}
                
                {selectedNote?.note.imageUrl && (
                  <div>
                    <h4 className="text-sm font-semibold">Image</h4>
                    <img 
                      src={selectedNote.note.imageUrl} 
                      alt="Progress" 
                      className="mt-2 max-h-64 rounded-md"
                    />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}