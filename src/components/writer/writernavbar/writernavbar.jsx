import { useState, useEffect, useContext } from 'react';
import { Layout, Button, Avatar, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  RocketOutlined,
  UserOutlined,
} from '@ant-design/icons';
import './writernavbar.css';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../store/UserContext';
import { processUserAvatar, getGenderBasedAvatar } from '../../../utils/imageUtils';
import { IMAGE_BASE_URL } from '../../../config/images';

const { Sider } = Layout;

const WriterNavbar = () => {
  const user = useContext(UserContext);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(window.innerWidth < 900);
  const [avatarSrc, setAvatarSrc] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 900);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setAvatarSrc(getGenderBasedAvatar());
      return;
    }
    const processed = processUserAvatar(user.avatarUrl, user.gender, IMAGE_BASE_URL);
    setAvatarSrc(processed);
  }, [user]);

  const handleAvatarError = (e) => {
    const fallback = getGenderBasedAvatar(user?.gender);
    if (e?.target && e.target.src !== fallback) {
      e.target.src = fallback;
    }
    return true;
  };

  return (
    <Sider className="writer-sider" width={220} collapsed={collapsed} collapsedWidth={64}>
      <div className="writer-navbar-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          className="writer-navbar-back"
          size="large"
          onClick={() => navigate('/')}
        />
      </div>

      <div className="writer-navbar-menu">
        <Tooltip
          title={collapsed ? 'Dashboard' : ''}
          placement="right"
          overlayClassName="writer-navbar-tooltip"
        >
          <Button
            type="text"
            icon={<DashboardOutlined />}
            className="writer-navbar-btn"
            block
            size="large"
            onClick={() => navigate('/writerdashboard')}
          >
            {!collapsed && 'Dashboard'}
          </Button>
        </Tooltip>

        <Tooltip
          title={collapsed ? 'Workspace' : ''}
          placement="right"
          overlayClassName="writer-navbar-tooltip"
        >
          <Button
            type="text"
            icon={<AppstoreOutlined />}
            className="writer-navbar-btn"
            block
            size="large"
            onClick={() => navigate('/writerworkspace')}
          >
            {!collapsed && 'Workspace'}
          </Button>
        </Tooltip>

        <Tooltip
          title={collapsed ? 'Interaction' : ''}
          placement="right"
          overlayClassName="writer-navbar-tooltip"
        >
          <Button
            type="text"
            icon={<RocketOutlined />}
            className="writer-navbar-btn"
            block
            size="large"
            onClick={() => navigate('/writerinteraction')}
          >
            {!collapsed && 'Interaction'}
          </Button>
        </Tooltip>
      </div>

      <div className="writer-navbar-footer writer-navbar-footer-fixed">
        <Tooltip title={collapsed ? user?.username || 'User' : ''} placement="right">
          <Avatar
            size={40}
            src={avatarSrc}
            icon={<UserOutlined />}
            className="writer-navbar-avatar"
            onError={handleAvatarError}
          />
        </Tooltip>
        {!collapsed && <span className="writer-navbar-username">{user?.username || 'User'}</span>}
      </div>
    </Sider>
  );
};

export default WriterNavbar;
