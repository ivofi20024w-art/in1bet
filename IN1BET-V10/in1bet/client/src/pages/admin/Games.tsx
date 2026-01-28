import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  Gamepad2,
  Building2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  gameCount: number;
  lastSyncedAt: string | null;
}

interface Game {
  id: string;
  name: string;
  idHash: string;
  providerName: string;
  gameType: string | null;
  status: string;
  imageUrl: string | null;
  isNew: boolean;
}

async function fetchProviders(): Promise<Provider[]> {
  const response = await fetch("/api/slotsgateway/providers", {
    credentials: 'include',
  });
  if (!response.ok) throw new Error("Failed to fetch providers");
  const data = await response.json();
  return data.providers || [];
}

async function fetchGames(providerName?: string): Promise<Game[]> {
  const params = new URLSearchParams();
  if (providerName) params.set("providerId", providerName);
  const response = await fetch(`/api/slotsgateway/games?${params}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error("Failed to fetch games");
  const data = await response.json();
  return data.success ? data.data : [];
}

async function syncAllGames(): Promise<{ count: number }> {
  const response = await fetch("/api/slotsgateway/sync", {
    method: "POST",
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to sync" }));
    throw new Error(error.error || "Failed to sync games");
  }
  const data = await response.json();
  return { count: data.count || 0 };
}

export default function AdminGames() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["admin-slotsgateway-providers"],
    queryFn: fetchProviders,
  });

  const { data: games = [], isLoading: loadingGames } = useQuery({
    queryKey: ["admin-slotsgateway-games", selectedProvider],
    queryFn: () => fetchGames(selectedProvider || undefined),
  });

  const syncGamesMutation = useMutation({
    mutationFn: syncAllGames,
    onSuccess: (data) => {
      toast.success(`${data.count} jogos sincronizados`);
      queryClient.invalidateQueries({ queryKey: ["admin-slotsgateway-providers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-slotsgateway-games"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao sincronizar jogos");
    },
  });

  const filteredGames = games.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.idHash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProviders = providers.length;
  const totalGames = games.length;
  const activeGames = games.filter((g) => g.status === "ACTIVE").length;

  return (
    <AdminLayout title="Gerenciamento de Jogos">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#111] border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription>Provedores Ativos</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                {loadingProviders ? "..." : activeProviders}/{providers.length}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-[#111] border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription>Total de Jogos</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-purple-500" />
                {loadingGames ? "..." : totalGames}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-[#111] border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription>Jogos Ativos</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                {loadingGames ? "..." : activeGames}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="bg-[#111] border-gray-800">
            <CardHeader className="pb-2">
              <CardDescription>API Status</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                {providers.length > 0 ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-emerald-500">Online</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span className="text-yellow-500 text-lg">Aguardando</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="bg-[#111] border border-gray-800">
            <TabsTrigger value="providers">Provedores</TabsTrigger>
            <TabsTrigger value="games">Jogos</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="mt-4">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Provedores de Jogos</CardTitle>
                  <CardDescription>
                    Gerencie os provedores de jogos do SlotsGateway
                  </CardDescription>
                </div>
                <Button
                  onClick={() => syncGamesMutation.mutate()}
                  disabled={syncGamesMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {syncGamesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar Jogos
                </Button>
              </CardHeader>
              <CardContent>
                {loadingProviders ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                ) : providers.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">Nenhum provedor sincronizado</p>
                    <p className="text-sm">
                      Configure as credenciais SLOTSGATEWAY_API_LOGIN e SLOTSGATEWAY_API_PASSWORD para sincronizar.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800">
                        <TableHead>Provedor</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="text-center">Jogos</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Última Sincronização</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers.map((provider) => (
                        <TableRow key={provider.id} className="border-gray-800">
                          <TableCell className="font-medium">{provider.name}</TableCell>
                          <TableCell className="text-gray-400">{provider.slug}</TableCell>
                          <TableCell className="text-center">{provider.gameCount || 0}</TableCell>
                          <TableCell className="text-center">
                            {provider.isActive ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-400 border-gray-600">
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {provider.lastSyncedAt ? (
                              <span className="flex items-center gap-1 text-gray-400 text-sm">
                                <Clock className="h-3 w-3" />
                                {new Date(provider.lastSyncedAt).toLocaleString("pt-BR")}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProvider(provider.name)}
                                className="border-gray-700"
                              >
                                Ver Jogos
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => syncGamesMutation.mutate()}
                                disabled={syncGamesMutation.isPending}
                                className="border-gray-700"
                              >
                                {syncGamesMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="mt-4">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Catálogo de Jogos</CardTitle>
                  <CardDescription>
                    {selectedProvider
                      ? `Jogos do provedor: ${selectedProvider}`
                      : "Todos os jogos disponíveis"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedProvider && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProvider(null)}
                      className="border-gray-700"
                    >
                      Limpar Filtro
                    </Button>
                  )}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar jogo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64 bg-black/50 border-gray-700"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingGames ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                  </div>
                ) : filteredGames.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum jogo encontrado</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead>Imagem</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>ID Hash</TableHead>
                          <TableHead>Provedor</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Novo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGames.slice(0, 100).map((game) => (
                          <TableRow key={game.id} className="border-gray-800">
                            <TableCell>
                              {game.imageUrl ? (
                                <img
                                  src={game.imageUrl}
                                  alt={game.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-gray-800 flex items-center justify-center">
                                  <Gamepad2 className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{game.name}</TableCell>
                            <TableCell className="text-gray-400 text-xs font-mono max-w-[150px] truncate">
                              {game.idHash}
                            </TableCell>
                            <TableCell>{game.providerName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs capitalize">
                                {game.gameType || "slot"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {game.status === "ACTIVE" ? (
                                <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {game.isNew ? (
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                  Novo
                                </Badge>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {filteredGames.length > 100 && (
                      <p className="text-center py-4 text-gray-400 text-sm">
                        Mostrando 100 de {filteredGames.length} jogos
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
