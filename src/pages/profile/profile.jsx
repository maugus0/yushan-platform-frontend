import { useEffect, useState } from 'react';
import { Layout, Button, Avatar, Typography, Divider, Tooltip, Spin } from 'antd';
import { EditOutlined, CalendarOutlined, StarFilled } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import './profile.css';
import * as LevelIcons from '../../components/user/icons/levelicon';
import { MaleIcon, FemaleIcon } from '../../components/user/icons/gendericon';
import { WriterIcon } from '../../components/user/icons/userrolesicon';
import userProfileService from '../../services/userProfile';
import gamificationApi from '../../services/gamification';
import achievementIcon from '../../assets/images/logo192.png';
import { updateUser } from '../../store/slices/user';
import { processUserAvatar, getGenderBasedAvatar } from '../../utils/imageUtils';
import { IMAGE_BASE_URL } from '../../config/images';

const { Content } = Layout;
const { Title, Text } = Typography;

const Profile = () => {
  const { user: currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Get userId from query string
  const searchParams = new URLSearchParams(location.search);
  const userId = searchParams.get('userId');

  const [user, setUser] = useState(currentUser);
  const [loading, setLoading] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState('');
  const [achievements, setAchievements] = useState([]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        if (userId && userId !== currentUser?.uuid) {
          const result = await userProfileService.getUserById(userId);
          // result = { user, achievements }
          setUser(result?.user || null);
          setAchievements(result?.achievements || []);
        } else {
          const response = await userProfileService.getCurrentUser();
          if (response.code === 200 && response.data) {
            setUser(response.data);
            dispatch(updateUser(response.data));
          }

          // load achievements for current user
          try {
            const ach = await gamificationApi.getMyAchievements();
            setAchievements(ach || []);
          } catch (e) {
            setAchievements([]);
          }
        }
      } catch (error) {
        setUser(currentUser);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [userId, currentUser?.uuid, dispatch]);

  // Update avatar source when user data changes
  useEffect(() => {
    if (user) {
      const processedAvatar = processUserAvatar(user.avatarUrl, user.gender, IMAGE_BASE_URL);
      setAvatarSrc(processedAvatar);
    }
  }, [user]);

  // Handle avatar loading error with gender-based fallback
  const handleAvatarError = (e) => {
    if (!e || !e.target) {
      console.warn('Avatar error handler called without event');
      return false;
    }
    const fallback = getGenderBasedAvatar(user?.gender);
    if (e.target.src !== fallback) {
      e.target.src = fallback;
    }
    return true;
  };

  if (loading || !user) {
    return (
      <Layout className="profile-layout-wrapper">
        <Content
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Spin size="large" tip="Loading profile..." />
        </Content>
      </Layout>
    );
  }

  const LevelIconComponent = LevelIcons[`LevelIcon${user.level}`] || LevelIcons.LevelIcon1;

  return (
    <Layout className="profile-layout-wrapper">
      <Content>
        <div className="profile-bg-section">
          <img
            src={require('../../assets/images/userprofilecover.png')}
            alt="profile-bg"
            className="profile-bg-img"
          />
          <div className="profile-bg-mask" />
          <div className="profile-bg-stats">
            <div className="profile-bg-stats-group">
              <div className="profile-bg-stats-item">
                <span className="profile-hours">{user.readTime}</span>
                <span className="profile-hours-label">hours of reading</span>
              </div>
              <div className="profile-bg-stats-divider" />
              <div className="profile-bg-stats-item">
                <span className="profile-books">{user.readBookNum}</span>
                <span className="profile-books-label">read books</span>
              </div>
            </div>
          </div>
          <div className="profile-avatar-wrapper">
            <Avatar
              src={avatarSrc}
              size={160}
              className="profile-avatar"
              onError={handleAvatarError}
            />
          </div>
        </div>
        <div className="profile-content-section">
          <div className="profile-header-row">
            <div className="profile-header-left">
              <Title level={2} className="profile-username">
                {user.username}
                {user.isAuthor && (
                  <Tooltip title="Author">
                    <WriterIcon
                      width={30}
                      height={30}
                      style={{ verticalAlign: 'middle', marginLeft: 8 }}
                    />
                  </Tooltip>
                )}
              </Title>
            </div>
            {/* Only show Edit Profile button if viewing own profile */}
            {(!userId || userId === currentUser?.uuid) && (
              <div className="profile-header-right">
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  className="profile-edit-btn"
                  onClick={() => {
                    navigate('/editprofile');
                  }}
                >
                  Edit Profile
                </Button>
              </div>
            )}
          </div>
          <div className="profile-info-row">
            <div className="profile-info-left">
              <Text
                className="profile-bio"
                style={{ fontSize: 16, marginBottom: 12, display: 'block', color: '#333' }}
              >
                {user.profileDetail || 'No bio yet.'}
              </Text>
              <div className="profile-id-row" style={{ marginBottom: 6 }}>
                <Text type="secondary" className="profile-uuid" style={{ fontSize: 13 }}>
                  ID: {user.uuid}
                </Text>
              </div>
              <div className="profile-email-row" style={{ marginBottom: 10 }}>
                <Text type="secondary" className="profile-email" style={{ fontSize: 13 }}>
                  email: {user.email}
                </Text>
              </div>
              <div
                className="profile-join-row"
                style={{ marginBottom: 6, display: 'flex', alignItems: 'center' }}
              >
                <CalendarOutlined style={{ marginRight: 6, fontSize: 17 }} />
                <Text type="secondary" className="profile-joined" style={{ fontSize: 13 }}>
                  {user.createDate || new Date(user.createTime).toLocaleDateString()} joined
                </Text>
                <Divider type="vertical" style={{ margin: '0 8px' }} />
                <span className="profile-exp" style={{ fontSize: 13 }}>
                  <StarFilled
                    style={{
                      color: '#faad14',
                      marginRight: 4,
                      fontSize: 17,
                      verticalAlign: 'middle',
                    }}
                  />
                  EXP: {user.exp || 0}
                </span>
              </div>

              {/* Achievements: header above the items */}
              {achievements && achievements.length > 0 && (
                <>
                  <div className="achievements-header">
                    <div
                      className="achievements-header-emoji"
                      role="img"
                      aria-label="achievements-emoji"
                    >
                      🏅
                    </div>
                    <div className="achievements-header-title">Achievements</div>
                  </div>

                  <div className="profile-achievements" aria-label="achievements">
                    {achievements.map((a) => {
                      const unlocked = a.unlockedAt
                        ? new Date(a.unlockedAt).toLocaleDateString('en-US')
                        : '';
                      const tip = `${a.description || ''}${unlocked ? ` — ${unlocked}` : ''}`;
                      return (
                        <Tooltip key={a.id} title={tip}>
                          <div className="achievement-item">
                            <img src={achievementIcon} alt={a.name} className="achievement-icon" />
                            <div className="achievement-name">{a.name}</div>
                          </div>
                        </Tooltip>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="profile-info-right">
              {user.gender === 1 || user.gender === 2 ? (
                <Tooltip title={user.gender === 1 ? 'Male' : 'Female'}>
                  {user.gender === 1 ? (
                    <MaleIcon width={20} height={20} style={{ verticalAlign: 'middle' }} />
                  ) : (
                    <FemaleIcon width={20} height={20} style={{ verticalAlign: 'middle' }} />
                  )}
                </Tooltip>
              ) : null}
              <Tooltip title={`Level ${user.level}`}>
                <LevelIconComponent width={40} height={40} style={{ verticalAlign: 'middle' }} />
              </Tooltip>
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default Profile;
