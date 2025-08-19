import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Box } from '../../app/muiImports';

// MarkdownMessage is a reusable component for rendering chat message content with Markdown support.
// It uses react-markdown and the remark-gfm plugin to support GitHub Flavored Markdown (GFM),
// including strikethrough, tables, and task lists. All markdown elements are mapped to MUI components
// for consistent styling with the rest of the app.
//
// The isOwnMessage prop is used to ensure proper text contrast for blockquotes, matching the chat bubble color logic.

// Props:
// - children: the raw markdown string to render
// - isOwnMessage: whether this message is sent by the current user (affects blockquote color)
interface MarkdownMessageProps {
  children: string;
  isOwnMessage?: boolean;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  children,
  isOwnMessage,
}) => (
  <ReactMarkdown
    // Enable GitHub Flavored Markdown (GFM) features
    remarkPlugins={[remarkGfm]}
    // Map markdown elements to MUI components for consistent styling
    components={{
      p: (props) => <Typography variant='body1' sx={{ mb: 0.5 }} {...props} />,
      strong: (props) => (
        <Typography component='span' fontWeight='bold' {...props} />
      ),
      em: (props) => (
        <Typography component='span' fontStyle='italic' {...props} />
      ),
      del: (props) => (
        <Typography
          component='span'
          sx={{ textDecoration: 'line-through' }}
          {...props}
        />
      ),
      code: (props) => (
        <Box
          component='code'
          sx={{
            bgcolor: 'grey.900',
            color: 'primary.contrastText',
            px: 0.5,
            borderRadius: 1,
            fontSize: '0.95em',
          }}
          {...props}
        />
      ),
      // Blockquote color is set for proper contrast depending on sender
      blockquote: (props) => (
        <Box
          component='blockquote'
          sx={{
            borderLeft: '3px solid',
            borderColor: 'primary.main',
            pl: 2,
            color: isOwnMessage ? 'primary.contrastText' : 'text.primary',
            my: 1,
          }}
          {...props}
        />
      ),
      ul: (props) => <Box component='ul' sx={{ pl: 3, mb: 1 }} {...props} />,
      ol: (props) => <Box component='ol' sx={{ pl: 3, mb: 1 }} {...props} />,
      li: (props) => <Typography component='li' variant='body1' {...props} />,
      a: (props) => (
        <Typography
          component='a'
          color='primary.main'
          sx={{ textDecoration: 'underline' }}
          target='_blank'
          rel='noopener noreferrer'
          {...props}
        />
      ),
    }}
  >
    {children}
  </ReactMarkdown>
);

export default MarkdownMessage;
