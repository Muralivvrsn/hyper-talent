import React, { useState, useContext } from 'react';
import { Drawer, List, ListItem, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/system';
import { PageContext } from '../../services/context/PageContext';
import { motion, AnimatePresence } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 60;

const MotionDrawer = styled(motion.div)(({ theme }) => ({
  boxSizing: 'border-box',
  backgroundColor: '#2f4f4f',
  color: '#ffffff',
  borderRight: '1px solid #444',
  overflow: 'hidden',
  position: 'fixed',
  height: '100%',
  top: 0,
  left: 0,
  zIndex: 1300,
  boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
}));

const DrawerItem = styled(ListItem)(({ theme, isHovered }) => ({
  margin: '10px 0',
  padding: '10px',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  display: 'flex',
  justifyContent: isHovered ? 'flex-start' : 'center',
  alignItems: 'center',
  transition: 'justify-content 0.3s',
}));

const DrawerTypography = styled(Typography)(({ theme, isHovered }) => ({
  transition: 'opacity 0.3s, margin-left 0.3s',
  opacity: isHovered ? 1 : 0,
  marginLeft: isHovered ? theme.spacing(1) : 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

const DrawerIcon = styled('img')(({ theme, isHovered }) => ({
  transition: 'opacity 0.3s',
  opacity: isHovered ? 0 : 1,
  width: 24,
  height: 24,
}));

const Navbar = () => {
  const { currentPage, setCurrentPage, pageConfig } = useContext(PageContext);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatePresence>
      <Drawer
        variant="permanent"
        PaperProps={{
          component: MotionDrawer,
          initial: { width: drawerWidthCollapsed },
          animate: { width: isHovered ? drawerWidthExpanded : drawerWidthCollapsed },
          exit: { width: drawerWidthCollapsed },
          transition: { duration: 0.5 },
        }}
        sx={{
          width: isHovered ? drawerWidthExpanded : drawerWidthCollapsed,
          '& .MuiDrawer-paper': {
            width: 'inherit',
            boxSizing: 'border-box',
            overflow: 'hidden',
          },
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <List>
          <DrawerItem isHovered={isHovered}>
            <Typography variant="h6" noWrap>
              Hyper Talent
            </Typography>
          </DrawerItem>
          {Object.keys(pageConfig).map((key) => (
            <DrawerItem
              button
              key={key}
              onClick={() => setCurrentPage(key)}
              isHovered={isHovered}
              sx={{ backgroundColor: currentPage === key ? 'rgba(255, 255, 255, 0.2)' : 'transparent' }}
            >
              <DrawerIcon src={pageConfig[key].icon} alt={`${key} icon`} />
              <DrawerTypography variant="body1" isHovered={isHovered}>{key}</DrawerTypography>
            </DrawerItem>
          ))}
        </List>
      </Drawer>
    </AnimatePresence>
  );
};

export default Navbar;