'use client';
import { useAuth } from '@/components/AuthProvider';
import AccountCircle from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Alert,
  AlertTitle,
  AppBar,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
} from './muiImports';

const Showcase = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [tab, setTab] = useState(0);
  const [slider, setSlider] = useState(30);
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState('a');

  const handleMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <Stack spacing={4} sx={{ width: '100%', maxWidth: 700, mx: 'auto', my: 4 }}>
      <AppBar position='static'>
        <Toolbar>
          <IconButton
            edge='start'
            color='inherit'
            aria-label='menu'
            onClick={handleMenu}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            AppBar Example
          </Typography>
          <Button color='inherit'>Login</Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>My account</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Breadcrumbs aria-label='breadcrumb'>
        <Link underline='hover' color='inherit' href='#'>
          Home
        </Link>
        <Link underline='hover' color='inherit' href='#'>
          Catalog
        </Link>
        <Typography color='text.primary'>Product</Typography>
      </Breadcrumbs>

      <Alert severity='info'>
        <AlertTitle>Info</AlertTitle>
        This is an info alert — <strong>check it out!</strong>
      </Alert>

      <Stack direction='row' flexWrap={'wrap'} gap={2}>
        <Button variant='contained' color='primary'>
          Primary
        </Button>
        <Button variant='outlined' color='primary'>
          Outlined
        </Button>
        <Button variant='text' color='primary'>
          Text
        </Button>
        <Button variant='contained' color='secondary' className='wide'>
          Secondary
        </Button>
        <Button variant='contained' color='success'>
          Success
        </Button>
        <Button variant='contained' color='error'>
          Error
        </Button>
        <Button variant='contained' color='warning'>
          Warning
        </Button>
        <Button variant='contained' color='info'>
          Info
        </Button>
      </Stack>

      <Stack direction='row' spacing={2}>
        <Chip label='Default' />
        <Chip label='Primary' color='primary' />
        <Chip label='Secondary' color='secondary' />
        <Chip label='Success' color='success' />
        <Chip label='Error' color='error' />
        <Chip label='Info' color='info' />
        <Chip label='Warning' color='warning' />
        <Chip avatar={<Avatar>M</Avatar>} label='Avatar' />
      </Stack>

      <Card>
        <CardContent>
          <Typography variant='h5' component='div'>
            Card Title
          </Typography>
          <Typography sx={{ mb: 1.5 }} color='text.secondary'>
            Card Subtitle
          </Typography>
          <Typography variant='body2'>Card content goes here.</Typography>
        </CardContent>
        <CardActions>
          <Button size='small'>Action</Button>
        </CardActions>
      </Card>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant='h6'>TextField Variants</Typography>
        <Stack spacing={2} mt={2}>
          <TextField label='Standard' variant='standard' fullWidth />
          <TextField label='Filled' variant='filled' fullWidth />
          <TextField label='Outlined' variant='outlined' fullWidth />
        </Stack>
      </Paper>

      <Stack direction='row' spacing={2} alignItems='center'>
        <FormControlLabel
          control={
            <Switch
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
          }
          label='Switch'
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
          }
          label='Checkbox'
        />
        <FormControl component='fieldset'>
          <FormLabel component='legend'>Radio Group</FormLabel>
          <RadioGroup
            row
            value={radio}
            onChange={(e) => setRadio(e.target.value)}
          >
            <FormControlLabel value='a' control={<Radio />} label='A' />
            <FormControlLabel value='b' control={<Radio />} label='B' />
            <FormControlLabel value='c' control={<Radio />} label='C' />
          </RadioGroup>
        </FormControl>
      </Stack>

      <Stack spacing={2}>
        <Typography gutterBottom>Slider</Typography>
        <Slider
          value={slider}
          onChange={(_, v) => setSlider(v as number)}
          aria-label='slider'
        />
        <LinearProgress variant='determinate' value={slider} />
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label='tabs'>
        <Tab icon={<HomeIcon />} label='Home' />
        <Tab icon={<SettingsIcon />} label='Settings' />
        <Tab icon={<AccountCircle />} label='Account' />
      </Tabs>

      <List>
        <ListItem>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary='Home' />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary='Settings' />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <AccountCircle />
          </ListItemIcon>
          <ListItemText primary='Account' />
        </ListItem>
      </List>

      <Divider />
      <Typography variant='caption' color='text.secondary'>
        End of MUI Theme Showcase
      </Typography>
    </Stack>
  );
};

const Home = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        minHeight='100vh'
        p={6}
      >
        <CircularProgress />
        <Typography variant='h6' mt={2}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return null; // Redirecting
  }

  return <Showcase />;
};

export default Home;
