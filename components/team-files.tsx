'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileUp, Github, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface TeamFile {
  id: string;
  original_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

interface GithubRepo {
  id: string;
  repository_url: string;
  title?: string;
  description?: string;
  created_at: string;
}

interface TeamFilesProps {
  teamId: string;
}

export function TeamFilesComponent({ teamId }: TeamFilesProps) {
  const [files, setFiles] = useState<TeamFile[]>([]);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [addingGithub, setAddingGithub] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubTitle, setGithubTitle] = useState('');
  const [githubDesc, setGithubDesc] = useState('');

  // Fetch team files and repos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [filesRes, reposRes] = await Promise.all([
          fetch(`/api/teams-files?teamId=${teamId}`, { credentials: 'include' }),
          fetch(`/api/teams-github?teamId=${teamId}`, { credentials: 'include' }),
        ]);

        if (filesRes.ok) {
          const data = await filesRes.json();
          setFiles(data.data?.files || []);
        }

        if (reposRes.ok) {
          const data = await reposRes.json();
          setRepos(data.data?.repos || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId]);

  // Upload file
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Bitte wählen Sie eine Datei');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`/api/teams-files?teamId=${teamId}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload fehlgeschlagen');
      }

      const data = await res.json();
      setFiles([...files, data.data?.file]);
      setSelectedFile(null);
      toast.success('Datei hochgeladen');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Upload');
    } finally {
      setUploading(false);
    }
  };

  // Add GitHub repo
  const handleAddGithub = async () => {
    if (!githubUrl) {
      toast.error('Bitte geben Sie eine GitHub URL ein');
      return;
    }

    try {
      setAddingGithub(true);
      const res = await fetch(`/api/teams-github?teamId=${teamId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          repositoryUrl: githubUrl,
          title: githubTitle || undefined,
          description: githubDesc || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Fehler beim Hinzufügen');
      }

      const data = await res.json();
      setRepos([...repos, data.data?.repo]);
      setGithubUrl('');
      setGithubTitle('');
      setGithubDesc('');
      toast.success('GitHub Repository hinzugefügt');
    } catch (error) {
      console.error('GitHub add error:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Hinzufügen');
    } finally {
      setAddingGithub(false);
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Datei wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/teams-files?teamId=${teamId}&fileId=${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setFiles(files.filter(f => f.id !== fileId));
        toast.success('Datei gelöscht');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  // Delete repo
  const handleDeleteRepo = async (repoId: string) => {
    if (!confirm('Repository wirklich löschen?')) return;

    try {
      const res = await fetch(`/api/teams-github?teamId=${teamId}&repoId=${repoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setRepos(repos.filter(r => r.id !== repoId));
        toast.success('Repository gelöscht');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Files Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Team Dateien
          </CardTitle>
          <CardDescription>Lade Dateien für dein Team hoch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <FileUp className="w-4 h-4" />
                Datei hochladen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Datei hochladen</DialogTitle>
                <DialogDescription>
                  Lade eine Datei für dein Team hoch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file">Datei</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      📎 {selectedFile.name}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleFileUpload}
                  disabled={uploading || !selectedFile}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    'Hochladen'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {files.length > 0 ? (
              files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{file.original_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(file.file_size / 1024)} KB
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={file.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-muted rounded"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteFile(file.id)}
                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Dateien hochgeladen
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GitHub Repos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Repositories
          </CardTitle>
          <CardDescription>Verlinke GitHub Repositories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full gap-2">
                <Github className="w-4 h-4" />
                Repository hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>GitHub Repository hinzufügen</DialogTitle>
                <DialogDescription>
                  Verlinke ein GitHub Repository für dein Team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="github-url">Repository URL *</Label>
                  <Input
                    id="github-url"
                    placeholder="https://github.com/username/repo"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="github-title">Titel (Optional)</Label>
                  <Input
                    id="github-title"
                    placeholder="z.B. Hackathon Project"
                    value={githubTitle}
                    onChange={(e) => setGithubTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="github-desc">Beschreibung (Optional)</Label>
                  <Textarea
                    id="github-desc"
                    placeholder="Beschreibe dein Projekt..."
                    value={githubDesc}
                    onChange={(e) => setGithubDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleAddGithub}
                  disabled={addingGithub || !githubUrl}
                  className="w-full"
                >
                  {addingGithub ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Wird hinzugefügt...
                    </>
                  ) : (
                    'Hinzufügen'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {repos.length > 0 ? (
              repos.map((repo) => (
                <div key={repo.id} className="flex items-start justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{repo.title || 'GitHub Repo'}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {repo.repository_url}
                    </p>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <a
                      href={repo.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-muted rounded"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteRepo(repo.id)}
                      className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Repositories verlinkt
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
