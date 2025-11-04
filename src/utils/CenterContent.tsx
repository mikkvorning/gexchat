import { Box } from '@/app/muiImports';

/**
 * Centers its children both vertically and horizontally within a flex container.
 * @param children - The content to be centered
 * @param sx - Optional additional styling to apply to the Box
 * @returns A Box component with centered children
 */
const CenterContent = ({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: object;
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default CenterContent;
