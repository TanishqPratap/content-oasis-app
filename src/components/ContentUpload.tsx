
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface ContentUploadProps {
  onContentUploaded: () => void;
}

export default function ContentUpload({ onContentUploaded }: ContentUploadProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'text' | 'image' | 'video'>('text');
  const [isPremium, setIsPremium] = useState(true);
  const [price, setPrice] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect content type based on file
      if (selectedFile.type.startsWith('image/')) {
        setContentType('image');
      } else if (selectedFile.type.startsWith('video/')) {
        setContentType('video');
      }
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile?.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('content-media')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('content-media')
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      let mediaUrl = null;
      
      // Upload file if present
      if (file) {
        mediaUrl = await uploadFile(file);
      }

      // Create content record
      const { error } = await supabase
        .from('content')
        .insert({
          creator_id: profile?.id,
          title: title.trim(),
          description: description.trim() || null,
          content_type: contentType,
          media_url: mediaUrl,
          is_premium: isPremium,
          price: price ? parseFloat(price) : null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Content uploaded successfully!"
      });

      // Reset form
      setTitle('');
      setDescription('');
      setContentType('text');
      setIsPremium(true);
      setPrice('');
      setFile(null);
      
      onContentUploaded();
    } catch (error: any) {
      toast({
        title: "Error uploading content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Content</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter content title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your content..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="content-type">Content Type</Label>
            <select
              id="content-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as 'text' | 'image' | 'video')}
              className="w-full p-2 border rounded-md"
            >
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>

          {(contentType === 'image' || contentType === 'video') && (
            <div>
              <Label htmlFor="file">Upload File</Label>
              <div className="mt-1">
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept={contentType === 'image' ? 'image/*' : 'video/*'}
                  className="w-full p-2 border rounded-md"
                />
                {file && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="premium"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
            />
            <Label htmlFor="premium">Premium Content (requires subscription)</Label>
          </div>

          <div>
            <Label htmlFor="price">Tip Price (optional)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
