
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateArticle } from '@/ai/flows/article-generation-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [articleContent, setArticleContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const articleTitle = decodeURIComponent(slug || '');

  useEffect(() => {
    if (articleTitle) {
      const fetchArticle = async () => {
        setLoading(true);
        setError('');
        try {
          const result = await generateArticle({ title: articleTitle });
          setArticleContent(result.articleContent);
        } catch (err) {
          console.error('Failed to generate article:', err);
          setError('Could not load the article at this time. Please try again later.');
          toast({
            variant: 'destructive',
            title: 'Failed to Load Article',
            description: 'There was a problem generating the content.',
          });
        } finally {
          setLoading(false);
        }
      };
      fetchArticle();
    }
  }, [articleTitle, toast]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Goals
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
                <CardTitle className="text-2xl md:text-3xl font-headline">{articleTitle}</CardTitle>
                <CardDescription>A personalized article generated just for you by Aya.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 text-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Aya is writing your article...</p>
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && (
            <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap font-body text-base/7">
              {articleContent}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
