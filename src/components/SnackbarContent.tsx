import { Box, Typography } from '@/app/muiImports';

const SnackbarContent = (title: string, description?: string) => {
  return (
    <Box>
      <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
      {description && <Typography variant='body2'>{description}</Typography>}
    </Box>
  );
};

export default SnackbarContent;
