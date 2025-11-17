'use client';

import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';

interface ArticleRowProps {
  id: string;
  title: string;
  category: string;
  sourceName: string;
  createdAt: Date | string;
}

export function ArticleRow({ id, title, category, sourceName, createdAt }: ArticleRowProps) {
  const handleCopyId = () => {
    navigator.clipboard.writeText(id);
    alert('Article ID copied!');
  };

  return (
    <TableRow>
      <TableCell>
        <button
          onClick={handleCopyId}
          className="text-xs font-mono text-primary hover:underline"
        >
          {id.slice(-8)}
        </button>
      </TableCell>
      <TableCell className="max-w-[400px] truncate font-medium">
        {title}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{category || 'unknown'}</Badge>
      </TableCell>
      <TableCell>{sourceName}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {new Date(createdAt).toLocaleString()}
      </TableCell>
    </TableRow>
  );
}

