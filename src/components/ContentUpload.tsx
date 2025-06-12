
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image, Video, FileText } from 'lucide-react';

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
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Auto-detect content type based on file
      if (selectedFile.type.startsWith('image/')) {
        setContentType('image');
        // Create preview for images
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith('video/')) {
        setContentType('video');
        setPreview(null);
      }
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile?.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    console.log('Uploading file:', fileName);
    
    const { data, error } = await supabase.storage
      .from('content-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('content-media')
      .getPublicUrl(data.path);
    
    console.log('File uploaded successfully:', publicUrl);
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

    if (profile?.role !== 'creator') {
      toast({
        title: "Error",
        description: "Only creators can upload content",
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

      if (error) {
        console.error('Content creation error:', error);
        throw error;
      }

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
      setPreview(null);
      
      onContentUploaded();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Error uploading content",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload New Content
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title">Content Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an engaging title for your content..."
              required
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your content to attract subscribers..."
              rows={3}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="content-type">Content Type</Label>
            <select
              id="content-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as 'text' | 'image' | 'video')}
              className="w-full p-3 mt-2 border rounded-md bg-background"
            >
              <option value="text">📝 Text Post</option>
              <option value="image">🖼️ Image</option>
              <option value="video">🎥 Video</option>
            </select>
          </div>

          {(contentType === 'image' || contentType === 'video') && (
            <div>
              <Label htmlFor="file">Upload {contentType === 'image' ? 'Image' : 'Video'}</Label>
              <div className="mt-2 space-y-4">
                <input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept={contentType === 'image' ? 'image/*' : 'video/*'}
                  className="w-full p-3 border rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                
                {file && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <div className="flex items-center space-x-2">
                      {contentType === 'image' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {preview && contentType === 'image' && (
                  <div className="mt-4">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-w-full h-48 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2 p-4 bg-muted rounded-md">
            <input
              type="checkbox"
              id="premium"
              checked={isPremium}
              onChange={(e) => setIsPremium(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="premium" className="text-sm">
              Premium Content (requires active subscription to view)
            </Label>
          </div>

          <div>
            <Label htmlFor="price">Optional Tip Price ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Set an optional tip amount that fans can pay to support this content
            </p>
          </div>

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Uploading Content...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Publish Content
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
